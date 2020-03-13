#This gon be a timeup script
import pymsgbox
import os
import asyncio
import websockets
import json
 
username = os.getlogin()

async def log_off(websocket, path):
    uri = "ws://johnlemmetown.com"
    async with websockets.connect(uri) as websocket:
        message = {'logged_on': True, 'username': username}
        message_json = json.dump(message)

        await websocket.send(message_json)
        ans = await websocket.recv()

        ans_cool = json.loads(ans)
        

# Prints the thign
print("\nYou are being logged out...")
pymsgbox.alert(text='test', title='test', button='OK')

# Logs user out
os.system("shutown -l")