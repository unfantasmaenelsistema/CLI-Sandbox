import { describe, expect, it } from 'vitest';
import { md5Hex, sha256Hex, utf8Length } from './hash';

describe('hash', () => {
  it('SHA-256 con los vectores de FIPS 180-4', () => {
    expect(sha256Hex('')).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
    expect(sha256Hex('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
    expect(sha256Hex('abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq')).toBe(
      '248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1'
    );
  });

  it('MD5 con los vectores de RFC 1321', () => {
    expect(md5Hex('')).toBe('d41d8cd98f00b204e9800998ecf8427e');
    expect(md5Hex('abc')).toBe('900150983cd24fb0d6963f7d28e17f72');
    expect(md5Hex('12345678901234567890123456789012345678901234567890123456789012345678901234567890')).toBe(
      '57edf4a22be3c955ac49da2e2107b67a'
    );
  });

  it('coincide con sha256sum y md5sum reales en texto con tildes, ñ y €', () => {
    // printf '%s' 'producción ñ €' | sha256sum   /   | md5sum
    expect(sha256Hex('producción ñ €')).toBe('4437af9234ba544b815a780aa9f76e039c45bc5a37a9d01e2af3d8213ed7aaba');
    expect(md5Hex('producción ñ €')).toBe('0f36b8e75e329a88f16d159e898bc461');
  });

  it('cuenta bytes en UTF-8', () => {
    expect(utf8Length('producción')).toBe(11);
  });
});
