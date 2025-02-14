import SQLite from 'react-native-sqlite-storage';

const db = SQLite.openDatabase(
  {name: 'chat.db', location: 'default'},
  () => console.log('Database connected'),
  error => console.error(' Database error:', error),
);

// Tạo các bảng trong DB
const createTables = () => {
  db.transaction(tx => {
    // Bảng người dùng
    tx.executeSql(
      `CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        phone TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      );`,
      [],
      () => console.log('Table users created'),
      error => console.error('Error creating users table:', error),
    );

    // Bảng nhóm chat
    tx.executeSql(
      `CREATE TABLE IF NOT EXISTS groups (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        groupName TEXT NOT NULL,
        idUser INTEGER NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (idUser) REFERENCES users(id)
      );`,
      [],
      () => console.log('Table groups created'),
      error => console.error('Error creating groups table:', error),
    );

    // Bảng tin nhắn
    tx.executeSql(
      `CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        text TEXT NOT NULL,
        idUser INTEGER NOT NULL,
        idGroup INTEGER NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (idUser) REFERENCES users(id),
        FOREIGN KEY (idGroup) REFERENCES groups(id)
      );`,
      [],
      () => console.log('Table messages created'),
      error => console.error('Error creating messages table:', error),
    );
  });
};

createTables();
