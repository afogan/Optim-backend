DROP TABLE IF EXISTS workspace_members;
DROP TABLE IF EXISTS workspaces;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
  id serial PRIMARY KEY,
  username text NOT NULL UNIQUE,
  password text NOT NULL,
  name text,
  email text UNIQUE
);

CREATE TABLE workspaces (
  id serial PRIMARY KEY,
  name text NOT NULL,
  owner_id integer NOT NULL REFERENCES users(id),
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE workspace_members (
  id serial PRIMARY KEY,
  workspace_id integer NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at timestamp NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, user_id)
);
