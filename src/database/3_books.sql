CREATE TABLE IF NOT EXISTS books (
    bookID INT PRIMARY KEY AUTO_INCREMENT,

    title VARCHAR(255) NOT NULL,

    author VARCHAR(255) NOT NULL,

    isbn VARCHAR(50) UNIQUE,

    description TEXT,

    categoryID INT,

    total_copies INT NOT NULL DEFAULT 1,

    available_copies INT NOT NULL DEFAULT 1,

    status ENUM('ACTIVE', 'INACTIVE')
        NOT NULL DEFAULT 'ACTIVE',

    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updatedAt TIMESTAMP
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_books_category
        FOREIGN KEY (categoryID)
        REFERENCES categories(categoryID)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    CONSTRAINT chk_book_copies
        CHECK (
            total_copies >= 0
            AND available_copies >= 0
            AND available_copies <= total_copies
        )
);

