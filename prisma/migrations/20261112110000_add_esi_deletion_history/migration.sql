IF OBJECT_ID(N'dbo.DeletedDetl', N'U') IS NULL
BEGIN
  CREATE TABLE [dbo].[DeletedDetl] (
    [EmpID] NVARCHAR(50) NOT NULL,
    [EmpName] NVARCHAR(200) NOT NULL,
    [Range] NVARCHAR(200) NOT NULL,
    [DeletedAt] DATETIME2(7) NOT NULL
      CONSTRAINT [DF_DeletedDetl_DeletedAt] DEFAULT (SYSUTCDATETIME()),
    [ApplCount] INT NOT NULL
  );
END;
