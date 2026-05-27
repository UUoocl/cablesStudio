The Keynote API op should allow the user to control Keynote.
It should expose the following functionality:
- Start Keynote
- Stop Keynote
- Move to next slide
- Move to previous slide
- Go to slide number
- Set current slide scene

##how it works

- the User sends an api request to '/api/keynote?request=...' from chrome browser

- The HTTP routes the request to the KeynoteAppi op

- The KeynoteApi op gets the query parameters  and uses JXA to control Keynote

##Implementation details
The OSA shell should be as a separate child process.

The JXA script is executed by the OSA shell.

The JXA scripts will be embedded as JS strings in the op and will be executed by the OSA shell.

the jxa scripts will be refactored versions of the @slides_studio/keynote-studio-app/shortcuts 

jxa returned results will be output as an object.

an SseSend op will return the results to the frontend


##Input

Object
trigger 


