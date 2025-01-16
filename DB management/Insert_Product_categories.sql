USE groeneweide;

DROP PROCEDURE IF EXISTS Insert_Product_categories;
DELIMITER $$
CREATE PROCEDURE Insert_Product_categories(
    IN InsertName VARCHAR(100)
)
BEGIN
    INSERT INTO Product_categories (Name)
    SELECT InsertName
    WHERE NOT EXISTS (
        SELECT 1
        FROM Product_categories
        WHERE Name = InsertName
    );
END$$
DELIMITER ;

CALL Insert_Product_categories('Fruit');
CALL Insert_Product_categories('Groenten');
CALL Insert_Product_categories('Vis');
CALL Insert_Product_categories('Vlees');
CALL Insert_Product_categories('Zuivel');
CALL Insert_Product_Categories('Overig');