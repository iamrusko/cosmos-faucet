import {Bip39, EnglishMnemonic, HdPath, Slip10, Slip10Curve} from '@cosmjs/crypto'

export class KeyUtils {
    public static async getPrivateKeyFromMnemonic(mnemonic: string, hdPath: HdPath) {
        const seed = await this.getSeedFromMnemonic(mnemonic);
        return this.getPrivateKeyFromSeed(seed, hdPath);
    }

    public static async getSeedFromMnemonic(mnemonic: string) {
        const mnemonicChecked = new EnglishMnemonic(mnemonic);
        return Bip39.mnemonicToSeed(mnemonicChecked);
    }

    public static getPrivateKeyFromSeed(seed: Uint8Array, hdPath: HdPath) {
        const {privkey} = Slip10.derivePath(Slip10Curve.Secp256k1, seed, hdPath);
        return privkey;
    }

    public static isPrivateKey(str: string): boolean {
        if (str.startsWith("0x")) {
            return true;
        }

        if (str.length === 64) {
            try {
                return Buffer.from(str, "hex").length === 32;
            } catch {
                return false;
            }
        }
        return false;
    }
}
