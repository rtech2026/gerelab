
const { betterAuth } = require('better-auth');
const { password } = require('better-auth/crypto');

async function test() {
  console.log('password crypto:', password);
  if (password && password.hash) {
    const hash = await password.hash('200230');
    console.log('hash of 200230:', hash);
  }
}
test();
