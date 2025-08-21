var createQuery = {
  createUsersTable:
    "CREATE TABLE user" +
    "(id int PRIMARY KEY AUTO_INCREMENT," +
    "first_name varchar(255), last_name varchar(255)," +
    "email varchar(255), password varchar(255), address varchar(255)," +
    "start_date Date, end_date DATE, working BOOLEAN DEFAULT FALSE, social_auth BOOLEAN DEFAULT FALSE, unique_identifier varchar(255))",
  createRoleTable:
    "CREATE TABLE role" +
    "(id int PRIMARY KEY AUTO_INCREMENT," +
    "role varchar(255))",
  createUserRoleTable:
    "CREATE TABLE user_role" +
    "(id int PRIMARY KEY AUTO_INCREMENT," +
    "roleId int, userId int)",
  createUserTypeTable:
    "CREATE TABLE user_type" +
    "(id int PRIMARY KEY AUTO_INCREMENT," +
    "type varchar(255))",
  createBoardTable:
    "CREATE TABLE board" +
    "(id int PRIMARY KEY AUTO_INCREMENT," +
    "user_id int, name varchar(255), create_date DATETIME DEFAULT CURRENT_TIMESTAMP, is_public BOOLEAN DEFAULT false, project_id int, is_archived int DEFAULT 0, is_active int DEFAULT 1, is_deleted int DEFAULT 0, " +
    "FOREIGN KEY (user_id) REFERENCES user(id), FOREIGN KEY (project_id) REFERENCES project(id))",
  createBoardUserTable:
    "CREATE TABLE board_user" +
    "(id int PRIMARY KEY AUTO_INCREMENT," +
    "user_id int, board_id int, role_id int," +
    "FOREIGN KEY (user_id) REFERENCES user(id)," +
    "FOREIGN KEY (role_id) REFERENCES role(id)," +
    "FOREIGN KEY (board_id) REFERENCES board(id) ON DELETE CASCADE," +
    "UNIQUE (user_id, board_id))",
  createBoardLabelTable:
    "CREATE TABLE board_label" +
    "(id int PRIMARY KEY AUTO_INCREMENT," +
    "name varchar(255),color varchar(255), board_id int," +
    "FOREIGN KEY (board_id) REFERENCES board(id))",
  createCoreLabelTable:
    "CREATE TABLE core_label" +
    "(id int PRIMARY KEY AUTO_INCREMENT," +
    "name varchar(255), color varchar(255))",
  createListTable:
    "CREATE TABLE list" +
    "(id int PRIMARY KEY AUTO_INCREMENT," +
    "board_id int, name varchar(255), created_date DATETIME DEFAULT CURRENT_TIMESTAMP, position int, is_archived int DEFAULT 0, is_backloged int DEFAULT 0, " +
    "FOREIGN KEY (board_id) REFERENCES board(id))",
  createTagTable:
    "CREATE TABLE tag" +
    "(id int PRIMARY KEY AUTO_INCREMENT," +
    "tag varchar(255),color varchar(255))",
  createCardsTable:
    "CREATE TABLE card" +
    "(id int PRIMARY KEY AUTO_INCREMENT, user_id int, " +
    "list_id int, name varchar(255),description varchar(255), create_date DATETIME DEFAULT CURRENT_TIMESTAMP," +
    "is_active BOOLEAN DEFAULT true, is_complete BOOLEAN DEFAULT false, due_date DATETIME, reminder_date DATETIME, progress int, position int, " +
    "FOREIGN KEY (list_id) REFERENCES list(id))",
  createCardUserTable:
    "CREATE TABLE card_user" +
    "(id int PRIMARY KEY AUTO_INCREMENT," +
    "user_id int, card_id int, role_id int," +
    "FOREIGN KEY (user_id) REFERENCES user(id)," +
    "FOREIGN KEY (card_id) REFERENCES card(id)," +
    "FOREIGN KEY (role_id) REFERENCES role(id)," +
    "UNIQUE (user_id, card_id))",
  createCardTagTable:
    "CREATE TABLE card_tag" +
    "(id int PRIMARY KEY AUTO_INCREMENT," +
    "tag_id int, card_id int, color varchar(255)," +
    "FOREIGN KEY (tag_id) REFERENCES tag(id)," +
    "FOREIGN KEY (card_id) REFERENCES card(id)," +
    "UNIQUE (tag_id, card_id))",
  createCardLabelTable:
    "CREATE TABLE card_label" +
    "(id int PRIMARY KEY AUTO_INCREMENT," +
    "label_id int, card_id int," +
    "FOREIGN KEY (label_id) REFERENCES board_label(id)," +
    "FOREIGN KEY (card_id) REFERENCES card(id))",
  createCheckListItemTable:
    "CREATE TABLE checklist_item" +
    "(id int PRIMARY KEY AUTO_INCREMENT," +
    "card_id int, name varchar(255), is_checked BOOLEAN DEFAULT false, position int," +
    "FOREIGN KEY (card_id) REFERENCES card(id))",
  createCommentTable:
    "CREATE TABLE comment" +
    "(id int PRIMARY KEY AUTO_INCREMENT," +
    "card_id int,user_id int, comment LONGTEXT, created_date DATETIME DEFAULT CURRENT_TIMESTAMP," +
    "FOREIGN KEY (card_id) REFERENCES card(id)," +
    "FOREIGN KEY (user_id) REFERENCES user(id))",
  createCardActivityTable:
    "CREATE TABLE card_activity" +
    "(id int PRIMARY KEY AUTO_INCREMENT," +
    "card_id int,user_id int, activity varchar(255), created_date DATETIME DEFAULT CURRENT_TIMESTAMP," +
    "FOREIGN KEY (card_id) REFERENCES card(id)," +
    "FOREIGN KEY (user_id) REFERENCES user(id))",
  createCardActivityAddedUserTable:
    "CREATE TABLE card_activity_added_user" +
    "(id int PRIMARY KEY AUTO_INCREMENT," +
    "card_activity_id int, added_user_id int, type int, created_date DATETIME," +
    "FOREIGN KEY (card_activity_id) REFERENCES card_activity(id)," +
    "FOREIGN KEY (added_user_id) REFERENCES user(id) ON DELETE SET NULL)",
  createCardActivityAddedChecklistTable:
    "CREATE TABLE card_activity_added_checklist" +
    "(id int PRIMARY KEY AUTO_INCREMENT," +
    "card_activity_id int, added_checklist_id int, type int, created_date DATETIME," +
    "FOREIGN KEY (card_activity_id) REFERENCES card_activity(id)," +
    "FOREIGN KEY (added_checklist_id) REFERENCES `checklist_item`(id) ON DELETE SET NULL)",
  createProjectTable:
    "CREATE TABLE project" +
    "(id int PRIMARY KEY AUTO_INCREMENT," +
    "name VARCHAR(255),description LONGTEXT, user_id int, is_public int DEFAULT 1, created_date DATETIME DEFAULT CURRENT_TIMESTAMP)",
  createProjectBoardTable:
    "CREATE TABLE project_board" +
    "(id int PRIMARY KEY AUTO_INCREMENT," +
    "project_id int, board_id int," +
    "FOREIGN KEY (project_id) REFERENCES project(id)," +
    "FOREIGN KEY (board_id) REFERENCES board(id))",
  createProjectUserTable:
    "CREATE TABLE project_user" +
    "(id int PRIMARY KEY AUTO_INCREMENT," +
    "user_id int, project_id int, role_id int, is_default int," +
    "FOREIGN KEY (user_id) REFERENCES user(id)," +
    "FOREIGN KEY (role_id) REFERENCES role(id)," +
    "FOREIGN KEY (project_id) REFERENCES project(id) ON DELETE CASCADE," +
    "UNIQUE (user_id, project_id))",
  createUploadedFileTable:
    "CREATE TABLE uploaded_file" +
    "(id INT PRIMARY KEY AUTO_INCREMENT," +
    " filePath VARCHAR(255), memory BIGINT, user_id INT, card_id INT, project_id INT, uploaded_date DATETIME DEFAULT CURRENT_TIMESTAMP, " +
    " FOREIGN KEY (user_id) REFERENCES user(id)," +
    " FOREIGN KEY (card_id) REFERENCES card(id), FOREIGN KEY (project_id) REFERENCES project(id)) ",
};
module.exports = createQuery;
