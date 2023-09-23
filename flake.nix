{
  description = "A Nix-flake-based Node.js and TypeScript development environment";

  inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";

  outputs = { self, nixpkgs }:
    let
      overlays = [
        (final: prev: rec {
          nodejs = prev.nodejs_20;
          typescript = prev.typescript;
        })
      ];
      supportedSystems = [ "x86_64-linux" ];
      forEachSupportedSystem = f: nixpkgs.lib.genAttrs supportedSystems (system: f {
        pkgs = import nixpkgs { inherit overlays system; };
      });
    in
    {
      devShells = forEachSupportedSystem ({ pkgs }: {
        default = pkgs.mkShell {
          packages = with pkgs; [ nodejs typescript ];
        };
      });

      packages = forEachSupportedSystem ({ pkgs }: {
        default = pkgs.stdenv.mkDerivation {
          name = "mpv-autoload";
          src = ./.; # or replace with the path to your TypeScript source code

          buildInputs = with pkgs; [ nodejs typescript ];

          buildPhase = ''
            export HOME=$(mktemp -d)
            tsc
          '';

          installPhase = ''
            mkdir -p $out
            cp -r dist/* $out/
          '';
        };
      });
    };
}
