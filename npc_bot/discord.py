import logging

import discord
from discord.ext import commands

from npc_bot.app_commands import AppCommands


class DiscordBot(commands.Bot):
    def __init__(self):
        intents = discord.Intents.default()
        intents.message_content = True
        super().__init__(command_prefix="", intents=intents)
        self.logger = logging.getLogger("discord")

    async def setup_hook(self):
        await self.add_cog(AppCommands(self))

        # Register and sync app commands
        await self.tree.sync()

    async def on_ready(self):
        self.logger.info(f"Logged in as {self.user}")

    async def on_message(self, message: discord.Message):
        pass
