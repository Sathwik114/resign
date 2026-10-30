ALTER TABLE [dbo].[EsiEmployee]
ADD [Verification] VARCHAR(20) NOT NULL
    CONSTRAINT [DF_EsiEmployee_Verification] DEFAULT ('Not Verified');
