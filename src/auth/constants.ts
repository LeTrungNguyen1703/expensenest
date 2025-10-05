export const jwtConstants = () => ({
  secret: process.env.JWT_SECRET ?? 'Can take jwt secret from env',
});
