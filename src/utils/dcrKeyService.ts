import crypto from 'crypto';
import { DcrVaultKeyMetadata } from '../types';

/**
 * In-memory secure keystore for AES-256-GCM keys.
 * Keys are tenant-isolated and keyed by `tenantId:version`.
 */
interface InMemoryKeyEntry {
  keyId: string;
  tenantId: string;
  keyBuffer: Buffer;
  version: number;
  status: 'ACTIVE' | 'ROTATED' | 'REVOKED';
  createdAt: string;
  algorithm: 'AES-256-GCM';
}

const KEY_REGISTRY = new Map<string, InMemoryKeyEntry>();

// Master Salt for Key Derivation if raw key is not yet generated
const MASTER_ALTIL_SALT = 'ALTIL-DCR-SECURE-VAULT-2026-KEY-STORE';

export const TransformationKeyService = {
  /**
   * Initializes or returns the active key for a tenant
   */
  getOrCreateActiveKey(tenantId: string = 'tenant-global'): InMemoryKeyEntry {
    const keyPrefix = `tenant:${tenantId}`;
    
    // Find highest active version
    let activeKey: InMemoryKeyEntry | undefined;
    for (const [_, entry] of KEY_REGISTRY.entries()) {
      if (entry.tenantId === tenantId && entry.status === 'ACTIVE') {
        if (!activeKey || entry.version > activeKey.version) {
          activeKey = entry;
        }
      }
    }

    if (!activeKey) {
      // Derive / generate a 32-byte cryptographic key for AES-256-GCM
      const rawSeed = `${MASTER_ALTIL_SALT}:${tenantId}:v1:${Date.now()}`;
      const derivedKey = crypto.pbkdf2Sync(rawSeed, MASTER_ALTIL_SALT, 100000, 32, 'sha256');
      
      const keyId = `KEY-${tenantId.toUpperCase()}-V1-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
      activeKey = {
        keyId,
        tenantId,
        keyBuffer: derivedKey,
        version: 1,
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
        algorithm: 'AES-256-GCM'
      };
      KEY_REGISTRY.set(keyId, activeKey);
    }

    return activeKey;
  },

  /**
   * Retrieve a specific key by key ID (for decryption of past records)
   */
  getKeyById(keyId: string): InMemoryKeyEntry | undefined {
    return KEY_REGISTRY.get(keyId);
  },

  /**
   * Rotate key for a tenant (marks previous as ROTATED, creates new ACTIVE v+1)
   */
  rotateKey(tenantId: string): DcrVaultKeyMetadata {
    const current = this.getOrCreateActiveKey(tenantId);
    current.status = 'ROTATED';

    const newVersion = current.version + 1;
    const rawSeed = `${MASTER_ALTIL_SALT}:${tenantId}:v${newVersion}:${Date.now()}`;
    const derivedKey = crypto.pbkdf2Sync(rawSeed, MASTER_ALTIL_SALT, 120000, 32, 'sha256');
    const newKeyId = `KEY-${tenantId.toUpperCase()}-V${newVersion}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    const newKeyEntry: InMemoryKeyEntry = {
      keyId: newKeyId,
      tenantId,
      keyBuffer: derivedKey,
      version: newVersion,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      algorithm: 'AES-256-GCM'
    };
    KEY_REGISTRY.set(newKeyId, newKeyEntry);

    return {
      keyId: newKeyEntry.keyId,
      tenantId: newKeyEntry.tenantId,
      algorithm: newKeyEntry.algorithm,
      version: newKeyEntry.version,
      status: newKeyEntry.status,
      createdAt: newKeyEntry.createdAt,
      activeTransformationsCount: 0
    };
  },

  /**
   * Encrypts plaintext using AES-256-GCM with a unique 12-byte IV and 16-byte authentication tag
   */
  encrypt(plainText: string, tenantId: string = 'tenant-global'): {
    ciphertext: string;
    keyReference: string;
    iv: string;
    authTag: string;
  } {
    const keyEntry = this.getOrCreateActiveKey(tenantId);
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', keyEntry.keyBuffer, iv);
    
    let encrypted = cipher.update(plainText, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag();

    // Ciphertext bundle: iv:authTag:encrypted
    const ciphertextBundle = `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;

    return {
      ciphertext: ciphertextBundle,
      keyReference: keyEntry.keyId,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex')
    };
  },

  /**
   * Decrypts ciphertext using AES-256-GCM
   */
  decrypt(ciphertextBundle: string, keyReference?: string): string {
    if (!ciphertextBundle) return '';
    try {
      const parts = ciphertextBundle.split(':');
      if (parts.length < 3) {
        // Fallback if not standard bundle format
        return ciphertextBundle;
      }
      const [ivHex, authTagHex, encryptedHex] = parts;
      
      let keyEntry: InMemoryKeyEntry | undefined;
      if (keyReference) {
        keyEntry = this.getKeyById(keyReference);
      }
      if (!keyEntry) {
        // Fallback to first available key
        keyEntry = KEY_REGISTRY.values().next().value || this.getOrCreateActiveKey('tenant-global');
      }

      if (!keyEntry) return '[DECRYPTION_KEY_UNAVAILABLE]';

      const decipher = crypto.createDecipheriv(
        'aes-256-gcm',
        keyEntry.keyBuffer,
        Buffer.from(ivHex, 'hex')
      );
      decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));

      let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (err: any) {
      console.warn('[TransformationKeyService] Decryption failed:', err.message);
      return '[CIPHERTEXT_ENCRYPTED]';
    }
  },

  /**
   * Generates a deterministic, fast SHA-256 hash for correlation without revealing raw PII
   */
  hashValue(value: string): string {
    return crypto.createHash('sha256').update(value.trim(), 'utf8').digest('hex');
  },

  /**
   * Computes a cryptographic event hash for audit chaining
   */
  computeEventHash(prevHash: string, eventData: Record<string, any>): string {
    const payload = `${prevHash}|${JSON.stringify(eventData)}`;
    return crypto.createHash('sha256').update(payload, 'utf8').digest('hex');
  },

  /**
   * Get all registered keys metadata
   */
  getAllKeysMetadata(): DcrVaultKeyMetadata[] {
    return Array.from(KEY_REGISTRY.values()).map(k => ({
      keyId: k.keyId,
      tenantId: k.tenantId,
      algorithm: k.algorithm,
      version: k.version,
      status: k.status,
      createdAt: k.createdAt,
      activeTransformationsCount: 12
    }));
  }
};
