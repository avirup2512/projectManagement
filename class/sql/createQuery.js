var createQuery = {
    createUsersTable: "CREATE TABLE user" +
        "(id int PRIMARY KEY AUTO_INCREMENT,"+
        "first_name varchar(255), last_name varchar(255)," +
        "email varchar(255), password varchar(255), address varchar(255)," +
        "start_date Date, end_date DATE, working BOOLEAN DEFAULT FALSE)",
    createOrGanizationTable: "CREATE TABLE organization" +
        "(id int PRIMARY KEY AUTO_INCREMENT,"+
        "name varchar(255), description varchar(255))",
    createOrGanizationCountryTable: "CREATE TABLE organization_country" +
        "(id int PRIMARY KEY AUTO_INCREMENT,"+
        "org_id int,country varchar(255), countryCode varchar(255))",
    createOrGanizationCountryStateTable: "CREATE TABLE organization_country_state" +
        "(id int PRIMARY KEY AUTO_INCREMENT,"+
        "org_country_id int,state varchar(255), stateCode varchar(255))",
    createOrGanizationCountryStateCityTable: "CREATE TABLE organization_country_state_city" +
        "(id int PRIMARY KEY AUTO_INCREMENT,"+
        "org_country_state_id int,city varchar(255), cityCode varchar(255)," +
        " UNIQUE (org_country_state_id, city))",
    createLocationTable: "CREATE TABLE location" +
        "(id int PRIMARY KEY AUTO_INCREMENT,"+
        "country varchar(255), state varchar(255)," +
        "city varchar(255), pincode int, street_name varchar(255))",
    createRoleTable: "CREATE TABLE role" +
        "(id int PRIMARY KEY AUTO_INCREMENT,"+
        "role varchar(255))",
    createUserRoleTable: "CREATE TABLE user_role" +
        "(id int PRIMARY KEY AUTO_INCREMENT,"+
        "roleId int, userId int)",
    createDepartMentTable: "CREATE TABLE department" +
        "(id int PRIMARY KEY AUTO_INCREMENT,"+
        "name varchar(255), description varchar(255))",
    createDepartMentOrganizationTable: "CREATE TABLE organization_department" +
        "(id int PRIMARY KEY AUTO_INCREMENT,"+
        "org_id int, organization_country_state_city_id int NOT NULL, dept_id int, UNIQUE (organization_country_state_city_id, dept_id))",
    createUserTypeTable: "CREATE TABLE user_type" +
        "(id int PRIMARY KEY AUTO_INCREMENT,"+
        "type varchar(255))",
    createOrganizationUserTable: "CREATE TABLE organization_user" +
        "(id int PRIMARY KEY AUTO_INCREMENT,"+
        "org_id int, user_id int, user_type_id int, org_country_state_city_id int)",
}
module.exports = createQuery;