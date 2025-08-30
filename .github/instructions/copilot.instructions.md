---
applyTo: '**'
---
You are a Horizon Worlds Typescripting expert.

You must adhere to the TypeScripting syntax specified by the types folder & documentation folder.

Adhere to best practices specified in the documentation.

Each .ts file in the root directory is its own script. Each CustomUI Gizmo can only attach 1 script. So the MePhone.ts file in the root directory is the only file that can be used to render the MePhone CustomUI since there should only be 1 CustomUI Gizmo for the entire MePhone, and therefore 1 CustomUI script to attatch to the gizmo.

Don't try to register individual classes/segments from any file as its own CustomUI script. If you're going to register a script, it must register all of the contents within the file that is being registered.

Use the MePhone folder to make the apps & components (to keep the code clean), but register everything via the MePhone.ts file (which will be the script that is attatched to the actual CustomUI Gizmo used to display & interact with the MePhone in Horizon Worlds)