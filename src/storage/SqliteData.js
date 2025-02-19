import SQLite from 'react-native-sqlite-storage';

// Tạo hoặc mở database SQLite
const db = SQLite.openDatabase(
  {name: 'FirebaseData.db', location: 'default'},
  () => {
    console.log('✅ SQLite Database Opened!');
  },
  error => {
    console.log('❌ SQLite Error: ', error);
  },
);

// Tạo bảng nếu chưa có
export const createTable = () => {
  db.transaction(tx => {
    tx.executeSql(
      `CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY, 
        name TEXT, 
        email TEXT, 
        age INTEGER
      );`,
      [],
      () => {
        console.log('✅ Table created successfully!');
      },
      error => {
        console.log('❌ Table creation error: ', error);
      },
    );
  });
};

// Lưu dữ liệu vào SQLite
export const saveUserToSQLite = (id, name, email, age) => {
  db.transaction(tx => {
    tx.executeSql(
      `INSERT OR REPLACE INTO users (id, name, email, age) VALUES (?, ?, ?, ?);`,
      [id, name, email, age],
      () => {
        console.log(`✅ User ${id} saved to SQLite!`);
      },
      error => {
        console.log('❌ Insert Error: ', error);
      },
    );
  });
};

// Lấy dữ liệu từ SQLite
export const getUsersFromSQLite = callback => {
  db.transaction(tx => {
    tx.executeSql(
      `SELECT * FROM users;`,
      [],
      (_, results) => {
        let rows = results.rows.raw(); // Trả về mảng dữ liệu
        callback(rows);
      },
      error => {
        console.log('❌ Fetch Error: ', error);
      },
    );
  });
};

// Xóa toàn bộ dữ liệu trong bảng
export const clearUsersTable = () => {
  db.transaction(tx => {
    tx.executeSql(
      `DELETE FROM users;`,
      [],
      () => {
        console.log('✅ Table cleared!');
      },
      error => {
        console.log('❌ Delete Error: ', error);
      },
    );
  });
};
