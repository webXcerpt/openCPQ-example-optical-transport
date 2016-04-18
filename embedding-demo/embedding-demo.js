// Embedding openCPQ-Based Configurators
// =====================================

// The following code could be made more concise by using some utility library
// (jquery, react.js, underscore.js, ...) and modern JavaScript syntax, but one
// purpose of this demo is to show that embedding openCPQ-based configurators
// does not have such dependencies.  Notice in particular that there is no
// dependency on react.js in this embedding application even though
// openCPQ-based configurators heavily rely on it.  Having no external
// dependencies here also ensures that you will not run into conflicts with the
// dependencies of the business application into which you are embedding
// openCPQ-based configurators.

(function() {

// Utilities
// =========

// URL Parsing
// -----------

// See https://gist.github.com/jlong/2428561 for the idea of using an anchor
// element as an URL parser.
var urlParser = document.createElement("a");
function getOrigin(url) {
    urlParser.href = url;
    // Microsoft Edge does not support urlParser.origin.
    var origin = urlParser.protocol + "//" + urlParser.host;
    // We support file URLs for development and test purposes. According to
    // https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage
    // targetOrigin "file://" does not work (currently) and must therefore be
    // replaced with "*".
    return origin === "file://" ? "*" : origin;
}

// Creating DOM Elements
// ---------------------

function el(type, options, children) {
  var e = document.createElement(type);
  for (var k in options || {})
    e[k] = options[k];
  for (var c in children || [])
    e.appendChild(children[c]);
  return e;
}


// References to DOM Elements
// ==========================

var create_item         = document.getElementById("create_item");
var select_type         = document.getElementById("select_type");
var list                = document.getElementById("list");
var configurator_pane   = document.getElementById("configurator_pane");
var configurator        = document.getElementById("configurator");


// Available Products
// ==================

// In this demo we use relative URLs for configurators.  In practice one might
// prefer absolute urls, which may also refer to separate HTTP servers.
var product_types = {
  "OS4"     : "../index.html?OS4",
  "OS6"     : "../index.html?OS6",
  "OS16"    : "../index.html?OS16",
  "solution": "../index.html?solution",
}


// Global Variables
// ================

// Some global state is needed because messages from the configurator can only
// be received by the window object of the embedding application.
var configuratorContext;
var nextConfiguratorTag = 0;


// Creating an Item in the List of Configurable Products
// =====================================================

function addItem(product_type) {
  // references to some DOM elements in the new item
  var tbody, collapse_expand, config, price, html;

  // create and insert a dom structure for the new item
  list.appendChild(tbody = el("TBODY", {}, [
    el("TR", {className: "separator"}),
    el("TR", {}, [
      el("TD", {}, [el("BUTTON", {textContent: "Configure", onclick: configure })]),
      el("TD", {}, [collapse_expand =
                    el("BUTTON", {textContent: "Collapse" , onclick: toggleView})]),
      el("TD", {}, [el("BUTTON", {textContent: "Delete"   , onclick: deleteItem})]),
      el("TD", {}, [el("INPUT" , {type: "text", size: 8, readOnly: true, value: product_type})]),
      el("TD", {}, [config =
                    el("INPUT" , {type: "text", size: 70, readOnly: true, placeholder: "---"})]),
      el("TD", {}, [price =
                    el("INPUT" , {type: "text", size: 12, readOnly: true, placeholder: "---",
                                  className: "price"})])
    ]),
    el("TR", {}, [
      el("TD", {colSpan: 6}, [
        html =
        el("DIV", {className: "html"}, [
          el("SPAN", {className: "not_configured", textContent: "(not yet configured)"})])])
    ])
  ]));

  // callback for the "Delete" button
  function deleteItem() {
    list.removeChild(tbody);
  }

  // callback for the "Collapse"/"Expand" button
  var visible = true;
  function toggleView() {
    visible = !visible;
    if (visible) {
      collapse_expand.textContent = "Collapse";
      html.style.display = "block";
    }
    else {
      collapse_expand.textContent = "Expand";
      html.style.display = "none";
    }
  }

  // callback for the "Configure" button
  function configure() {
    // Load the configurator into the configurator iframe:
    configurator.src = product_types[product_type];

    // Prepare a context for handling messages from the configurator:
    configuratorContext = {

      // a unique tag identifying this configurator invocation;
      // (used to ensure that any delayed message from an earlier configurator
      // invocation will not be erroneously treated as if it came from a later
      // invocation)
      tag: "cfg_" + nextConfiguratorTag++,

      // configurator URL without a possible fragment part
      // (used by the configurator to check if a message is actually intended
      // for this configurator rather than for a configurator loaded earlier or
      // later)
      urlWithoutFragment: configurator.src.replace(/#.*/, ""),

      // have we received the "ready" message from the configurator?
      // (used to detect reloads of the iframe contents)
      ready: false,

      // the configurator window (for exchanging messages)
      window: configurator.contentWindow,

      // make the configurator visible or invisible
      setVisibility: function setVisibility(visible) {
        configurator_pane.style.visibility = visible ? "visible" : "hidden";
        if (!visible)
          // load a simple page to free up resources used by the configurator
          configurator.src = "no-configurator.html";
      },

      // the current configuration to be passed to the configurator
      // (openCPQ expects a missing configuration as `undefined´)
      configuration: config.value || undefined,

      // write configuration results to the appropriate DOM elements
      store_results: function store_results(args) {
          if (args.hasOwnProperty("value"))
            config.value = args.value;
          if (args.hasOwnProperty("html"))
            html.innerHTML = args.html;
          if (args.hasOwnProperty("price"))
            price.value = args.price;
        }

    }
  }
}

// Filling the List
// ================

// Insert some initial items for convenience.
["OS4", "OS6", "OS16", "solution"].map(addItem);

// Fill the product-type menu.
for (var product_type in product_types)
  select_type.appendChild(el("OPTION", {textContent: product_type}));

create_item.onclick = function() { addItem(select_type.value); };


// Handling Events from the Configurator Window
// ============================================

// Message Protocol
// ----------------

// The embedding application and the configurator communicate as follows:
//
// - The embedding application loads the configurator in an iframe.
//
// - When the configurator is fully loaded in the iframe, it sends a message of
//   the form
//
//     {
//       "url": configurator_url, // document.URL without a fragment
//       "action": "ready"
//     }
//
//   to its parent window, where the embedding application runs.
//   The embedding application notes the fact that the confgurator is ready by
//   setting the `ready´ property of the context to `true´.
//
// - In response the embedding application creates a new tag and sends a
//   message of the form
//
//     {
//       "url": configurator_url, // as in the "ready" message
//       "tag": configurator_invocation_tag, // a new string for each configurator invocation
//       "action": "init",
//       "args": {
//         "config": configuration, // initial configuration to display in the configurator;
//                                  // a string not understood by the embedder
//         "embedderOrigin": origin_of_the_embedding_application
//                                  // string, as used for the "same-origin policy"
//       }
//     }
//
// - Finally, when the user has edited the configuration and wants to store the
//   results, the configurator sends to the embedder a message of the form
//
//     {
//       "url": configurator_url, // as in the "ready" message
//       "tag": configurator_invocation_tag, // as in the "init" message
//       "action": "close",
//       "args": {
//         "value": configuration, // the returned configuration;
//                                 // a string not understood by the embedder
//         "html": configuration_as_html, // string containing HTML syntax
//         "price": configuration_price // numeric value
//       }
//     }
//
//   The "args" property is omitted if the user does not want to store results.
//   The format of property "args" is application-specific.  The embedding
//   application and the configurator have to agree on the format.
//
// - In response the embedder will delete the configurator iframe or make it
//   invisible.
//
// Both the configurator and the embedding application check incoming messages
// whether they look as expected.  This is to avoid the handling of
// - malicious messages or
// - messages that came from or were intended for another configurator instance.
// The latter can happen due to the asynchronicity of browser messaging.
// (Actually not all of the checks are needed in each usage scenario.)
//
// The embedder-side message handler below also detects and handles the
// situation when the user reloads the contents of the configurator iframe.


// Message Handler Callback
// ------------------------

// This function should be reusable in your code, provided you pass it an
// appropriate context object.
function handleMessage(context, event) {
  var data = event.data;

  // Part 1: Check if the message fits with what we expect
  // -----------------------------------------------------

  if (event.source !== context.window) {
    // In this case we might ignore the message silently because it might
    // be a legitimate message for some other subsystem of the embedding
    // application.  If this is possible, deactivate the following statement:
    alert("Received message from unexpected window.");
    return;
  }
  if (data.url !== context.urlWithoutFragment) {
    alert("Received message with unexpected configurator URL:\n" + data.url);
    return;
  }
  if (context.ready) {
    if (data.tag !== context.tag) {
      if (data.tag === undefined && data.action === "ready") {
        alert(
          "It looks like you reloaded the configurator frame. " +
          "The configurator will be re-initialized."
        );
      }
      else {
        alert(
          "Received message with tag '" + context.tag +
          "' from configurator. " + "Expected '" + data.tag + "'.");
          return;
      }
    }
  }
  else {
    if (data.tag !== undefined) {
      alert("Did not expect a tag ('" + data.tag + "') from a newly loaded configurator.");
      return;
    }
  }
  // If we come here, the message should be valid.

  // Part 2: Actually Handle the Message
  // -----------------------------------

  switch(data.action) {
    case "ready":
      context.ready = true;
      context.setVisibility(true);
      context.window.postMessage(
        {
          url: context.urlWithoutFragment,
          tag: context.tag,
          action: "init",
          args: {
            config: context.configuration,
            embedderOrigin: getOrigin(document.URL)
          }
        },
        getOrigin(context.urlWithoutFragment)
      );

      break;
    case "close":
      context.setVisibility(false);
      if (data.args)
        context.store_results(data.args);
      break;
    default:
      throw "unexpected message action: " + data.action;
  }
}

// Message-Handler Registration
// ----------------------------

window.addEventListener("message", function(event) {
  // Pass the current configurator context.
  handleMessage(configuratorContext, event);
});

})();
