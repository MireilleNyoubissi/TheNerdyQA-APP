-- CREATE TABLE questions (
--   id SERIAL PRIMARY KEY,
--   category VARCHAR(200),
--   title VARCHAR(200),
--   content TEXT NOT NULL,
--   user_id INT REFERENCES users,
--   created_at TIMESTAMP
-- );

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100),
  email VARCHAR(100),
  passwd  VARCHAR(200)
);



CREATE TABLE questions (
  id SERIAL PRIMARY KEY,
  title VARCHAR(200),
  tried_content TEXT NOT NULL,
  expected_content TEXT NOT NULL,
  category VARCHAR(200),
  user_id INT REFERENCES users,
  created_at TIMESTAMP
);



CREATE TABLE answers (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users (id),
  category VARCHAR(200),
  title VARCHAR(200),
  responder VARCHAR(200),
  content TEXT NOT NULL,
  created_at TIMESTAMP,
  question_id INT REFERENCES questions (id) ON DELETE CASCADE
);







//user_id,
  INSERT INTO questions (title, tried_content, expected_content, category, created_at) 
  VALUES ('What is HTML?', 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit','Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.','html','NOW();');

  INSERT INTO answers (category, title, content, user_id, created_at, question_id) 
  VALUES ('html', 'What is HTML?', 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehender', '1','NOW();', '1');

  INSERT INTO users (username, email, passwd)
  VALUES ('Krishan', '123@test.com', 'cyf123');


  