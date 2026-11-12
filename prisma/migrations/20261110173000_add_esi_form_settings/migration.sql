CREATE TABLE [dbo].[EsiFormSettings] (
  [SettingId] TINYINT NOT NULL
    CONSTRAINT [PK_EsiFormSettings] PRIMARY KEY,
  [IsEnabled] BIT NOT NULL
    CONSTRAINT [DF_EsiFormSettings_IsEnabled] DEFAULT (1),
  CONSTRAINT [CK_EsiFormSettings_Singleton] CHECK ([SettingId] = 1)
);

INSERT INTO [dbo].[EsiFormSettings] ([SettingId], [IsEnabled])
VALUES (1, 1);
