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

        task = await websocket.recv()
        task_json = json.loads(task)
        
        if task_json[task] == 'info':
            message = {'logged_on': True, 'username': username}
            message_json = json.dump(message)
            await websocket.send(message_json)
        elif task_json[task] == 'kill':
            print("\nYou are being logged out...")
            os.system("shutown -l")
        

pymsgbox.alert(text='test', title='test', button='OK')

