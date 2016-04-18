Optical-Networks Configurator
=============================
*A demo example for [openCPQ](https://github.com/webXcerpt/openCPQ).*

The hypothetical company OptoKom SE sells switches for optical networks.

Configuration Rules
-------------------

For the demo configurator, assume the following:
- There are three products, OptoSwitch 4, OptoSwitch 6, and OptoSwitch 16.
- OptoSwitch 4 provides 4 slots, which can be equipped with
  boards. Similarly, OptoSwitch 6 and OptoSwitch 16 provide 6 and 16
  slots, respectively.
- There are single-width boards and double-width boards (which occupy two adjacent slots).
- A double-width board can only be inserted into slots with odd numbers
  in OptoSwitch 6 or OptoSwitch 16. Double-width boards cannot be used
  in OptoSwitch 4.
- Boards can have electrical interfaces or
  a number of ports of certain types which can be equipped with transceivers of the same type.
- A module-carrier board can be equipped with modules,
  which in turn have electrical interfaces or can be equipped with transceivers.
- The optical switches can be mounted into racks.
  The height units used by the optical switches have to be respected.
- Racks contain additional fan trays which depend on the heat dissipation of the contained devices.
- Racks can contain an uninteruptible power supply (UPS). The dimensioning of the UPS depends on the used power.

Configuration Modes
------------------

Different configuration modes are supported:
- Configuration of single products (OptoSwitch 4/6/16).
- Configuration of a solution consisting of racks equipped with switches,
  a network-management system, and additional services.
  To make the configuration more comfortable, some parameters can be given at
  the top level.

Maintenance of the Configurator
-------------------------------

The product models are maintained by three different roles:
- The openCPQ modeling expert models the structure of the configurator and the structure of each product.
  JavaScript and openCPQ knowledge is required, as well as some understanding of the configuration process and the products.
  This part of the configurator changes only when new products are introduced or products are changed heavily.
- The product manager maintains nearly-tabular data for the components (boards, modules, and transceivers).
  This nearly-tabular data is represented in JSON format (in file `resources/components.json`). This part of the configurator might change every month.
  It might be imported from a PDM system.
- The basic-data manager maintains materials with descriptions and prices in tabular form (as tab-separated values in file `resources/materials.tsv`).
  This data can change daily and should be loaded at each start of the configurator. It might be imported from an ERP system.

An Embedding Application
------------------------

Directory `embedding-demo` contains a simple application demonstrating how
configurators can be embedded into business applications.

Running the Configurator in the Web
-----------------------------------

Demo configurators are available for
[OptoSwitch 4](http://opencpq.webxcerpt.com/examples/optical-transport/index.html?OS4),
[OptoSwitch 6](http://opencpq.webxcerpt.com/examples/optical-transport/index.html?OS6),
[OptoSwitch 16](http://opencpq.webxcerpt.com/examples/optical-transport/index.html?OS16),
and for a complete
[solution](http://opencpq.webxcerpt.com/examples/optical-transport/index.html?solution).

There is also a demo for the
[embedding of configurators](http://opencpq.webxcerpt.com/examples/optical-transport/embedding-demo/embedding-demo.html)
in a business application.

Building and Serving the Configurator
-------------------------------------

The commands below require that you have the programs
[`git`](https://git-scm.com/), `node` (actually the `node` program
coming with [`iojs`](https://iojs.org/en/index.html) and `npm` (also
coming with `iojs`) installed and in your "PATH".

Run the following commands to build and serve the configurator:

```sh
$ git clone https://github.com/webXcerpt/openCPQ-example-optical-transport.git
$ cd openCPQ-example-optical-transport
$ npm install
$ npm run dev-server
```

Now point your browser to
http://localhost:8080/webpack-dev-server/index.html?OS4,
http://localhost:8080/webpack-dev-server/index.html?OS6,
http://localhost:8080/webpack-dev-server/index.html?OS16 or
http://localhost:8080/webpack-dev-server/index.html?solution
(or to [http://localhost:8080/webpack-dev-server/embedding-demo/embedding-demo.html](http://localhost:8080/webpack-dev-server/embedding-demo/embedding-demo.html)
for the embedding demo).
The development server will observe your changes to the code, rebuilding
the application as needed and reloading it in your browser.  This is
quite comfortable for configurator development.  You can stop the
development server with Control-C.

To build the application in directory `./dst/` in "production mode", run

```sh
$ npm run build
```

(still from within `openCPQ-example-optical-transport`).

To deploy that build via FTP to your HTTP server you can run

```sh
$ npm run deploy
```

This requires that you have a file `deployment.json` of the form

```json
{
  "host": "...",
  "user": "...",
  "password": "...",
  "folder": "..."
}
```

providing the FTP location and credentials for the deployment.
