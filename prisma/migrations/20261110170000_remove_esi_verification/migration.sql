DECLARE @dropConstraints NVARCHAR(MAX) = N'';

SELECT @dropConstraints = @dropConstraints +
  N'ALTER TABLE [dbo].[EsiEmployee] DROP CONSTRAINT ' + QUOTENAME(dc.[name]) + N';'
FROM sys.default_constraints AS dc
INNER JOIN sys.columns AS c
  ON c.[object_id] = dc.[parent_object_id]
  AND c.[column_id] = dc.[parent_column_id]
WHERE dc.[parent_object_id] = OBJECT_ID(N'dbo.EsiEmployee')
  AND c.[name] IN (N'Verification', N'VerifiedBy', N'VerifiedAt');

IF @dropConstraints <> N''
  EXEC sys.sp_executesql @dropConstraints;

IF COL_LENGTH(N'dbo.EsiEmployee', N'Verification') IS NOT NULL
  ALTER TABLE [dbo].[EsiEmployee] DROP COLUMN [Verification];

IF COL_LENGTH(N'dbo.EsiEmployee', N'VerifiedBy') IS NOT NULL
  ALTER TABLE [dbo].[EsiEmployee] DROP COLUMN [VerifiedBy];

IF COL_LENGTH(N'dbo.EsiEmployee', N'VerifiedAt') IS NOT NULL
  ALTER TABLE [dbo].[EsiEmployee] DROP COLUMN [VerifiedAt];
