DROP DATABASE IF EXISTS groeneweide;
CREATE DATABASE groeneweide;
USE groeneweide;

-- ## 1 ## --

CREATE TABLE Users (
    UserID int PRIMARY KEY AUTO_INCREMENT,
    Email varchar(100) NOT NULL UNIQUE,
    Phone varchar(100) NOT NULL UNIQUE,
    FirstName varchar(100)NOT NULL,
    Lastname varchar(100) NOT NULL,
    HouseNumber varchar(10) NOT NULL,
    StreetName varchar(100) NOT NULL,
    PostalCode varchar(10) NOT NULL,
    Country varchar(100) NOT NULL
);

CREATE TABLE Recipes (
    RecipeID int PRIMARY KEY AUTO_INCREMENT,
    Name varchar(100) NOT NULL UNIQUE,
    AssetsURL varchar(100) NOT NULL,
    PeopleServed varchar(100) NOT NULL,
    PrepTime varchar(100) NOT NULL
);

CREATE TABLE Product_categories (
    CategoryID int PRIMARY KEY AUTO_INCREMENT,
    Name varchar(100) NOT NULL UNIQUE
);

CREATE TABLE Facilities (
    FacilityID int PRIMARY KEY AUTO_INCREMENT,
    Name varchar(100) NOT NULL UNIQUE,
    AssetsURL varchar(100) NOT NULL
);

-- ## 2 ## --

CREATE TABLE Bookings (
    BookingID int PRIMARY KEY AUTO_INCREMENT,
    UserID int NOT NULL,
    NumberOfGuests int NOT NULL CHECK (NumberOfGuests>0),
    NumberOfKeycards int NOT NULL CHECK (NumberOfKeycards>=0),
    MomentStart timestamp NOT NULL,
    MomentEnd timestamp NOT NULL,
    PlaceNumber varchar(10) NOT NULL,
    CheckedIn boolean NOT NULL DEFAULT 0,
    FOREIGN KEY (UserID) REFERENCES Users(UserID) ON DELETE CASCADE
);

CREATE TABLE Products (
    ProductID int PRIMARY KEY AUTO_INCREMENT,
    CategoryID int NOT NULL,
    Name varchar(100) NOT NULL UNIQUE,
    AssetsURL varchar(100) NOT NULL,
    Price int NOT NULL CHECK (Price>=0),
    Size varchar(10) NOT NULL,
    AmountInStock int NOT NULL CHECK (AmountInStock>=0),
    FOREIGN KEY (CategoryID) REFERENCES Product_categories(CategoryID) ON DELETE CASCADE
);

CREATE TABLE Activities (
    ActivityID int PRIMARY KEY AUTO_INCREMENT,
    FacilityID int NOT NULL,
    Name varchar(100) NOT NULL UNIQUE,
    AssetsURL varchar(100) NOT NULL,
    Price int NOT NULL CHECK (Price>=0),
    MomentStart timestamp NOT NULL,
    MomentEnd timestamp NOT NULL,
    MaxSpaces int NOT NULL CHECK (MaxSpaces>0),
    FixedTime boolean NOT NULL DEFAULT 1,
    FOREIGN KEY (FacilityID) REFERENCES Facilities(FacilityID) ON DELETE CASCADE
);

-- ## 3 ## --

CREATE TABLE Lockers (
    LockerID varchar(10) PRIMARY KEY,
    BookingID int,
    MomentDelivered timestamp,
    FOREIGN KEY (BookingID) REFERENCES Bookings(BookingID) ON DELETE CASCADE
);

CREATE TABLE Keycards (
    CardID varchar(10) PRIMARY KEY,
    BookingID int,
    FOREIGN KEY (BookingID) REFERENCES Bookings(BookingID) ON DELETE CASCADE
);

CREATE TABLE Recipe_parts (
    RecipeID int NOT NULL,
    ProductID int NOT NULL,
    Amount int NOT NULL CHECK (Amount>0),
    FOREIGN KEY (RecipeID) REFERENCES Recipes(RecipeID) ON DELETE CASCADE,
    FOREIGN KEY (ProductID) REFERENCES Products(ProductID) ON DELETE CASCADE
);

-- ## 4 ## --

CREATE TABLE Orders (
    OrderID int PRIMARY KEY AUTO_INCREMENT,
    BookingID int NOT NULL,
    LockerID varchar(10),
    Price int NOT NULL CHECK (Price>=0),
    MomentCreated timestamp NOT NULL,
    MomentDelivered timestamp,
    MomentGathered timestamp,
    FOREIGN KEY (BookingID) REFERENCES Bookings(BookingID) ON DELETE CASCADE,
    FOREIGN KEY (LockerID) REFERENCES Lockers(LockerID) ON DELETE CASCADE
);

CREATE TABLE Reservations (
    ReservationID int PRIMARY KEY AUTO_INCREMENT,
    CardID varchar(10) NOT NULL,
    ActivityID int NOT NULL,
    MomentStart timestamp NOT NULL,
    MomentEnd timestamp NOT NULL,
    FOREIGN KEY (CardID) REFERENCES Keycards(CardID) ON DELETE CASCADE,
    FOREIGN KEY (ActivityID) REFERENCES Activities(ActivityID) ON DELETE CASCADE
);

CREATE TABLE Keylog (
    LogID int PRIMARY KEY AUTO_INCREMENT,
    CardID varchar(10) NOT NULL,
    FacilityID int NOT NULL,
    UseType varchar(10) NOT NULL,
    MomentUsed timestamp NOT NULL,
    FOREIGN KEY (CardID) REFERENCES Keycards(CardID) ON DELETE CASCADE,
    FOREIGN KEY (FacilityID) REFERENCES Facilities(FacilityID) ON DELETE CASCADE
);

-- ## 5 ## --

CREATE TABLE Ordered_products (
    ProductID int PRIMARY KEY AUTO_INCREMENT,
    OrderID int NOT NULL,
    Amount int NOT NULL CHECK (Amount>0),
    FOREIGN KEY (OrderID) REFERENCES Orders(OrderID) ON DELETE CASCADE
);