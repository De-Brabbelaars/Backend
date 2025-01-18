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

CALL Insert_Products(7,'Kaas','/Assets/Products/Kaas/',580,'0.5KG',23);
CALL Insert_Products(5,"Hollands Nieuwe (haring)",'/Assets/Products/Hollands Nieuwe (haring)/',325,'1KG',7);
CALL Insert_Products(3,"Appels","/Assets/Products/Appels/",179,'1KG',20);
CALL Insert_Products(3,"Peren","/Assets/Products/Peren/",196,"1KG",15);
CALL Insert_Products(4,"Rode bieten","/Assets/Products/Rode bieten/",169,"1KG",10);
CALL Insert_Products(4,"Gele bieten","/Assets/Products/Gele bieten/",179,"1KG",6);
CALL Insert_Products(4,"Witte bieten","/Assets/Products/Witte bieten/",169,"1KG",3);
CALL Insert_Products(4,"Oerbieten","/Assets/Products/Oerbieten/",169,"1KG",8);
CALL Insert_Products(6,"Bertha's Riblappen","/Assets/Products/Bertha's Riblappen/",1895,'5KG',2);
CALL Insert_Products(8, 'Chips', '/Assets/Products/Chips/', 150, '200g', 50);
CALL Insert_Products(2, 'Sap', '/Assets/Products/Sap/', 350, '1L', 10);
CALL Insert_Products(1, 'Brood', '/Assets/Products/Brood', 200, '1kg', 20);
CALL Insert_Products(7, 'Melk', '/Assets/Products/Melk/', 120, '500ml', 75);
CALL Insert_Products(7, 'Boter', '/Assets/Products/Boter/', 250, '250g', 15);
CALL Insert_Products(8, 'Eieren', '/Assets/Products/Eieren/', 175, '12-stuks', 20);
CALL Insert_Products(2, 'Frisdrank', '/Assets/Products/Frisdrank/', 220, '500ml', 8);
CALL Insert_Products(8, 'Pasta', '/Assets/Products/Pasta/', 185, '500g', 12);
CALL Insert_Products(7, 'Yoghurt', '/Assets/Products/Yoghurt/', 130, '150g', 18);
CALL Insert_Products(6, 'Wagyu', '/Assets/Products/Wagyu/', 1000, '115g', 1)