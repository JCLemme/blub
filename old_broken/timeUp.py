#Connects via WebSockets to blub server
#When kill request is received (via idle or timeout), displays msgbox and logs out the user

import pymsgbox
import os
import asyncio
import websockets
import json
 
username = os.getlogin()

async def log_off(websocket, path):
    uri = "ws://localhost:3000"
    async with websockets.connect(uri) as websocket:

        task = await websocket.recv()
        task_json = json.loads(task)
        
        if task_json[task] == 'info':
            message = {'logged_on': True, 'username': username}
            await websocket.send(message)
        elif task_json[task] == 'kill':
            print("\nYou are being logged out...")
            pymsgbox.alert(text='test', title='test', button='OK')
            #I assume we need a wait here if that message box is gonna be visible for any length of time
            # os.system("shutdown -l")