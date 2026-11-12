IF COL_LENGTH(N'dbo.EsiEmployee', N'UptdBy') IS NULL
  ALTER TABLE [dbo].[EsiEmployee] ADD [UptdBy] NVARCHAR(200) NULL;

IF COL_LENGTH(N'dbo.EsiEmployee', N'UptdAt') IS NULL
  ALTER TABLE [dbo].[EsiEmployee] ADD [UptdAt] DATETIME2 NULL;
