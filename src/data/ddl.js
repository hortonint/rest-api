import dotenv from 'dotenv';
import readline from 'readline';
import argon2 from 'argon2';
import Theme from '../models/theme.model.js';
import User from '../models/user.model.js';
import connection from './connection.js';
import { argon2Options } from '../configs/argon2.config.js';

dotenv.config();

const promptUser = (question) => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(`\x1b[36m${question}\x1b[0m `, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
};

const adminUser = async (inputName, inputPassword, inputEmail, themeId) => {
  const hash = await argon2.hash(inputPassword, argon2Options);

  return {
    name: inputName,
    email: inputEmail,
    password: hash,
    role: 'admin',
    themeId,
    vCard: {
      person: {},
      professional: {},
      contact: {},
      location: {},
      socialMedia: {},
      avatar: {
        size: {},
        format: {},
      },
    },
  };
};

const theme = {
  name: 'CardMesh',
  display: {},
  logo: {
    size: {},
    format: {},
  },
};

async function installUser(themeId) {
  console.log('\n\x1b[1mCreate admin user:\x1b[0m');
  const username = await promptUser('\tEnter name:');
  const email = await promptUser('\tEnter e-mail:');
  const password = await promptUser('\tEnter password:');

  console.log('\n\x1b[32mUser installation complete!\x1b[0m');

  await new User(await adminUser(username, password, email, themeId)).save();
}

(async () => {
  try {
    await connection(process.env.DB_CONNECTION);

    await Promise.all([
      Theme.collection.drop(),
      User.collection.drop(),
    ]);

    const newTheme = await new Theme(theme).save();
    console.log('\n\x1b[32mTheme setup complete!\x1b[0m');

    await installUser(newTheme.themeId);

    console.log('\n\x1b[32mDatabase setup completed.\x1b[0m');
  } catch (err) {
    console.error('\n\x1b[31mError setting up database:', err, '\x1b[0m');
  } finally {
    process.exit();
  }
})();
