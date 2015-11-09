
- When working on openCPQ and this application at the same time, use
  these two commands for a continuous build (in this directory):

```
babel --stage 0 ~/openCPQ/opencpq/src --watch --out-dir node_modules/opencpq/dst --source-maps inline &
npm run dev-server &
```

- This configurator app can be tested in embedded mode using
  http://localhost:8080/test-wrapper.html.

  Alternatively some embedding application can be symlinked (UNTESTED).



- I don't really understand why I have to declare the dependencies
  "bootstrap" and "babel-plugin-object-assign" in package.json.  They
  seem to be required indirectly, but are not declared as dependencies
  by the requiring packages.
