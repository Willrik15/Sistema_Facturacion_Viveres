import * as fs from 'fs';
import { isAbsolute, join } from 'path';
import * as forge from 'node-forge';
import * as crypto from 'crypto';
import { ExclusiveCanonicalization } from 'xml-crypto';
import { DOMParser } from '@xmldom/xmldom';

interface CanonicalizationProcessor {
  process: (node: Node) => string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function sha1b64(data: Buffer): string {
  return crypto.createHash('sha1').update(data).digest('base64');
}

function sha256b64(data: Buffer): string {
  return crypto.createHash('sha256').update(data).digest('base64');
}

function canonicalize(xmlStr: string): Buffer {
  const doc = new DOMParser().parseFromString(xmlStr, 'text/xml');
  const element = doc.documentElement;
  const canonicalization =
    new ExclusiveCanonicalization() as unknown as CanonicalizationProcessor;
  return Buffer.from(canonicalization.process(element), 'utf8');
}

/** Issuer DN from forge cert, reversed (SRI format) */
function issuerDN(cert: forge.pki.Certificate): string {
  const attrs = [...cert.issuer.attributes].reverse();
  const shortNames: Record<string, string> = {
    commonName: 'CN',
    organizationName: 'O',
    organizationalUnitName: 'OU',
    countryName: 'C',
    stateOrProvinceName: 'ST',
    localityName: 'L',
    emailAddress: 'E',
    serialName: 'SN',
  };
  return attrs
    .map(
      (a) =>
        `${String(a.shortName || shortNames[String(a.name)] || a.name || '')}=${String(a.value)}`,
    )
    .join(',');
}

/** Serial number as decimal */
function serialDec(cert: forge.pki.Certificate): string {
  const hex = (cert.serialNumber || '').replace(/^0+/, '') || '0';
  return BigInt('0x' + hex).toString(10);
}

/** ISO 8601 with Ecuador offset −05:00 */
function isoNow(): string {
  const now = new Date();
  const local = new Date(now.getTime() - 5 * 3600000);
  const p = (n: number) => String(n).padStart(2, '0');
  return (
    `${local.getUTCFullYear()}-${p(local.getUTCMonth() + 1)}-${p(local.getUTCDate())}` +
    `T${p(local.getUTCHours())}:${p(local.getUTCMinutes())}:${p(local.getUTCSeconds())}-05:00`
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function firmarXML(xml: string): string {
  const password = process.env.P12_PASSWORD;
  const configuredPath = process.env.P12_PATH || './firma.p12';

  const candidatePaths = [
    configuredPath,
    isAbsolute(configuredPath)
      ? configuredPath
      : join(process.cwd(), configuredPath),
    join(process.cwd(), 'src', 'auth', 'certificados', 'firma.p12'),
    join(process.cwd(), 'src', 'sri', 'certificados', 'firma.p12'),
    join(process.cwd(), 'firma.p12'),
  ];

  const p12Path = candidatePaths.find((p) => fs.existsSync(p));
  if (!password) throw new Error('P12_PASSWORD no configurado');
  if (!p12Path)
    throw new Error(`P12 no encontrado. Probado: ${candidatePaths.join(', ')}`);

  // ── Extraer clave y certificados ──────────────────────────────────────────
  const p12Asn1 = forge.asn1.fromDer(
    fs.readFileSync(p12Path).toString('binary'),
  );
  const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, password);

  let privateKeyPem = '';
  const allCerts: forge.pki.Certificate[] = [];

  for (const sc of p12.safeContents) {
    for (const bag of sc.safeBags) {
      if (bag.key) privateKeyPem = forge.pki.privateKeyToPem(bag.key);
      if (bag.cert) allCerts.push(bag.cert);
    }
  }

  if (!privateKeyPem || allCerts.length === 0) {
    throw new Error('No se pudo extraer clave/certificado del P12');
  }

  const endEntity = allCerts[0];

  const certDerBuf = Buffer.from(
    forge.asn1.toDer(forge.pki.certificateToAsn1(endEntity)).getBytes(),
    'binary',
  );
  const certB64 = certDerBuf.toString('base64');
  const certDigestB64 = sha1b64(certDerBuf);
  const issuerName = issuerDN(endEntity);
  const serialNumber = serialDec(endEntity);
  const signingTime = isoNow();

  const uid = Date.now();
  const sigId = `Signature${uid}`;
  const spId = `${sigId}-SignedPropertiesId`;
  const spRefId = `SignedPropertiesId${uid}`;

  // ── 1. Digest del comprobante (SHA-256, C14N, enveloped) ──────────────────
  const comprobanteDigest = sha256b64(canonicalize(xml));

  // ── 2. SignedProperties + digest SHA-1 ───────────────────────────────────
  const spXml =
    `<xades:SignedProperties xmlns:xades="http://uri.etsi.org/01903/v1.3.2#" Id="${spId}">` +
    `<xades:SignedSignatureProperties>` +
    `<xades:SigningTime>${signingTime}</xades:SigningTime>` +
    `<xades:SigningCertificate><xades:Cert>` +
    `<xades:CertDigest>` +
    `<ds:DigestMethod xmlns:ds="http://www.w3.org/2000/09/xmldsig#" Algorithm="http://www.w3.org/2000/09/xmldsig#sha1"/>` +
    `<ds:DigestValue xmlns:ds="http://www.w3.org/2000/09/xmldsig#">${certDigestB64}</ds:DigestValue>` +
    `</xades:CertDigest>` +
    `<xades:IssuerSerial>` +
    `<ds:X509IssuerName xmlns:ds="http://www.w3.org/2000/09/xmldsig#">${issuerName}</ds:X509IssuerName>` +
    `<ds:X509SerialNumber xmlns:ds="http://www.w3.org/2000/09/xmldsig#">${serialNumber}</ds:X509SerialNumber>` +
    `</xades:IssuerSerial>` +
    `</xades:Cert></xades:SigningCertificate>` +
    `</xades:SignedSignatureProperties>` +
    `</xades:SignedProperties>`;

  const spDigest = sha1b64(canonicalize(spXml));

  // ── 3. SignedInfo ─────────────────────────────────────────────────────────
  const signedInfoXml =
    `<ds:SignedInfo xmlns:ds="http://www.w3.org/2000/09/xmldsig#">` +
    `<ds:CanonicalizationMethod Algorithm="http://www.w3.org/2001/10/xml-exc-c14n#"/>` +
    `<ds:SignatureMethod Algorithm="http://www.w3.org/2000/09/xmldsig#rsa-sha1"/>` +
    `<ds:Reference URI="#comprobante">` +
    `<ds:Transforms><ds:Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature"/></ds:Transforms>` +
    `<ds:DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"/>` +
    `<ds:DigestValue>${comprobanteDigest}</ds:DigestValue>` +
    `</ds:Reference>` +
    `<ds:Reference Id="${spRefId}" Type="http://uri.etsi.org/01903#SignedProperties" URI="#${spId}">` +
    `<ds:Transforms><ds:Transform Algorithm="http://www.w3.org/2001/10/xml-exc-c14n#"/></ds:Transforms>` +
    `<ds:DigestMethod Algorithm="http://www.w3.org/2000/09/xmldsig#sha1"/>` +
    `<ds:DigestValue>${spDigest}</ds:DigestValue>` +
    `</ds:Reference>` +
    `</ds:SignedInfo>`;

  // ── 4. Firma RSA-SHA1 sobre C14N(SignedInfo) ──────────────────────────────
  const signer = crypto.createSign('RSA-SHA1');
  signer.update(canonicalize(signedInfoXml));
  const sigValueB64 = signer.sign(privateKeyPem, 'base64');

  // ── 5. Ensamblar <ds:Signature> ───────────────────────────────────────────
  const signatureBlock =
    `<ds:Signature xmlns:ds="http://www.w3.org/2000/09/xmldsig#" Id="${sigId}">` +
    signedInfoXml +
    `<ds:SignatureValue Id="${sigId}-SignatureValue">${sigValueB64}</ds:SignatureValue>` +
    `<ds:KeyInfo Id="${sigId}-KeyInfo">` +
    `<ds:X509Data><ds:X509Certificate>${certB64}</ds:X509Certificate></ds:X509Data>` +
    `</ds:KeyInfo>` +
    `<ds:Object Id="${sigId}-Object">` +
    `<xades:QualifyingProperties xmlns:xades="http://uri.etsi.org/01903/v1.3.2#" Target="#${sigId}">` +
    spXml +
    `</xades:QualifyingProperties>` +
    `</ds:Object>` +
    `</ds:Signature>`;

  // ── 6. Insertar antes de </factura> ──────────────────────────────────────
  return xml.replace('</factura>', `${signatureBlock}</factura>`);
}
