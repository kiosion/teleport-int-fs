## Generate localhost certificates
- Install `mkcert` and `nss` for generating locally trusted certificates
- Run `mkcert -install` to set up the local CA
- Run `mkcert localhost` within the `api/certs` dir to generate a certificate for localhost
