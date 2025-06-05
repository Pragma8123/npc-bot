import logging
from io import BytesIO

import discord
import pkg_resources
from discord import app_commands
from discord.ext import commands

from npc_bot.ai import generate_image


class AppCommands(commands.Cog):
    def __init__(self, bot):
        self.bot = bot
        self.logger = logging.getLogger("discord")

    @app_commands.command(
        name="image",
        description="Generate an AI image using FLUX1-schnell",
    )
    @app_commands.describe(
        prompt="Prompt to generate image with",
    )
    async def image(
        self,
        interaction: discord.Interaction,
        prompt: str,
    ):
        # Defer our response while waiting on our image to generate
        await interaction.response.defer(thinking=True)

        image: bytes | None = None
        try:
            image = await generate_image(prompt)
        except Exception as e:
            self.logger.error(e)
            await interaction.edit_original_response(
                content="There was an error generating your image 🤔."
            )
            return

        if image != None:
            image_file = discord.File(
                BytesIO(image), filename="image.png", spoiler=True
            )
        content = f"**Prompt**: `{prompt}`\n"
        await interaction.followup.send(content=content, files=[image_file], wait=True)

    @app_commands.command(name="version")
    async def version(self, interaction: discord.Interaction):
        version = pkg_resources.get_distribution("npc_bot").version
        await interaction.response.send_message(
            content=f"Version: {version}", ephemeral=True
        )
