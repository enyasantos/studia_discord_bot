declare module "sfxr" {
  const sfxr: {
    generate: (preset: string) => Uint8Array;
  };

  export default sfxr;
}
