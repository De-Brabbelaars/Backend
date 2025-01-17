USE groeneweide;

DROP PROCEDURE IF EXISTS Insert_Products;
DELIMITER $$
CREATE PROCEDURE Insert_Products(
    IN InCategoryID int,
    IN InName varchar(100),
    IN InAssetsURL varchar(100),
    IN InPrice  int,
    IN InSize varchar(10),
    IN InAmountInStock int
)
BEGIN
    INSERT INTO Products (CategoryID, Name, AssetsURL, Price, Size, AmountInStock)
    SELECT InCategoryID, InName, InAssetsURL, InPrice, InSize, InAmountInStock
    WHERE NOT EXISTS (
        SELECT 1
        FROM Products
        WHERE Name = InName
    );
END$$
DELIMITER ;

CALL Insert_Products(5,'Kaas','example.com',580,'0.5KG',23);
CALL Insert_Products(3,"Hollands Nieuwe (haring)",'example.com',325,'1KG',7);
CALL Insert_Products(1,"Appels","example.com",179,'1KG',20);
CALL Insert_Products(2,"Rode bieten","example.com",169,"1KG",10);
CALL Insert_Products(4,"Bertha's Riblappen","example.com",1895,'5KG',2);
CALL Insert_Products(3, 'Chips', 'example.com', 150, '200g', 50);
CALL Insert_Products(1, 'Sap', 'example.com', 350, '1L', 10);
CALL Insert_Products(2, 'Brood', 'example.com', 200, '1kg', 20);
CALL Insert_Products(4, 'Melk', 'example.com', 120, '500ml', 75);
CALL Insert_Products(5, 'Boter', 'example.com', 250, '250g', 15);
CALL Insert_Products(6, 'Eieren', 'example.com', 175, '12-stuks', 20);
CALL Insert_Products(3, 'Frisdrank', 'example.com', 220, '500ml', 8);
CALL Insert_Products(2, 'Pasta', 'example.com', 185, '500g', 12);
CALL Insert_Products(4, 'Yoghurt', 'example.com', 130, '150g', 18);
CALL Insert_Products(6, 'Wagyu', 'example.com', 1000, '115g', 1)