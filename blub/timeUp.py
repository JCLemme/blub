#This gon be a timeup script
import os
import asyncio
import websockets
import json
 
async def log_off(websocket, path):
    uri = "ws://johnlemmetown.com"
    async with websockets.connect(uri) as websocket:
        ans = await websocket.recv()

        ans_cool = json.loads(ans)
        

# Prints the thign
print("\nYou are being logged out...")

# Logs user out
os.system("shutown -l")
from pymsgbox import *

alert(text='test', title='test', button='OK')
