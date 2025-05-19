from setuptools import setup, find_packages

setup(
    name="cloudtracker",
    version="0.1.0",
    packages=find_packages(),
    install_requires=[
        "fastapi",
        "sqlalchemy",
        "pydantic",
        "aiohttp",
        "pocketflow",
    ],
) 