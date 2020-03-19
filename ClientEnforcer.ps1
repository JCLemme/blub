Try{  
    Do{
        $WS = New-Object System.Net.WebSockets.ClientWebSocket                                                
        $CT = New-Object System.Threading.CancellationToken                                                   

        $Conn = $WS.ConnectAsync("beer.egr.uri.edu:8082", $CT)                                                  
        While (!$Conn.IsCompleted) { Start-Sleep -Milliseconds 100 }

        Write-Verbose "Connected to WebSocket server!"

        $Size = 1024
        $Array = [byte[]] @(,0) * $Size
		$Recv = New-Object System.ArraySegment[byte] -ArgumentList @(,$Array)
		
		While ($WS.State -eq 'Open') {

            $out = ""

            Do {
                $Conn = $WS.ReceiveAsync($Recv, $CT)
                While (!$Conn.IsCompleted) { Start-Sleep -Milliseconds 100 }

                $Recv.Array[0..($Conn.Result.Count - 1)] | ForEach { $out += [char]$_ }

            } Until ($Conn.Result.Count -lt $Size)

			Write-Verbose "`n$out"
			
			If ($RTM){
                $RTM = ($RTM | convertfrom-json)

                Switch ($RTM){
                    {($_.type -eq 'message') -and (!$_.reply_to)} { 

                        If ( ($_.text -Match "<@$($RTMSession.self.id)>") -or $_.channel.StartsWith("D") ){
                            #A message was sent to the bot

                            # *** Responses go here, for example..***
                            $words = ($_.text.ToLower() -split " ")

                            Switch ($words){
                                {@("hey","hello","hi") -contains $_} { Send-SlackMsg -Text 'Hello!' -Channel $RTM.Channel }
                                {@("bye","cya") -contains $_} { Send-SlackMsg -Text 'Goodbye!' -Channel $RTM.Channel }

                                default { Write-Verbose "I have no response for $_" }
                            }

                        }Else{
                            Write-Verbose "Message ignored as it wasn't sent to @$($RTMSession.self.name) or in a DM channel"
                        }
                    }
                    {$_.type -eq 'reconnect_url'} { $RTMSession.URL = $RTM.url }

                    default { Write-Verbose "No action specified for $($RTM.type) event" }            
				}
			}
        }   
    } Until (!$Conn)

}Finally{

    If ($WS) { 
        Write-Verbose "Closing WebSocket..."
        $WS.Dispose()
    }

}