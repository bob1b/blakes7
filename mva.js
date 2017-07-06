

// constructor
function MVA(options){
  var componentCounter = 0;
  var components = [];
  var prevComponents = [];
  var changeWatchInterval;
  var debugLevel = -1;
  var isStarted = 0;


  // TODO - fix line numbers
  function debug(message, messageLevel){
    if (typeof(messageLevel) === 'undefined'){
      messageLevel = 0;
    }

    if (1 || debugLevel >= messageLevel){
      console.log(message);
    }
  }

  debug('MVA options:');
  debug(options);

  var _options = Object.assign(
    { watchTimeout:500 }, // milliseconds
    options );


  // save previous component states to check against current states
  function updatePrevComponents(){
    prevComponents = [components.length];
    for ( var i = 0; i < components.length; i++ ){
      // only update active components so that paused components will see their potentially new
      // state after being restarted
      if ( components[i]._internal.active ){
        prevComponents[i] = JSON.parse(JSON.stringify(components[i]));
      }
    }
  }

  function validateComponentId( componentId ){
    return ( componentId < componentCounter && components[componentId] !== undefined )
  }

  function renderComponent( componentId ){
    if ( !validateComponentId(componentId) ){
      debug('renderComponent(): component with id "' + componentId + '" is not defined');
      return;
    }

    debug('rendering component #' + componentId + ' "' + components[componentId].name + '"');
    debug(components[componentId]);

    var numViews = components[componentId].component.views.length;

    // TODO - test multiple views
    for ( var i = 0; i < numViews; i++ ){
      var view = components[componentId].component.views[i];

      var dest = $(view.destination);
      if ( dest.length <= 0 ){
        debug('renderComponent(): could not find destination element in DOM: "' + view.destination + '"');
        continue;
      }

      debug('view  = ');
      debug(view);

      if ( view.renderer ){
        var _html = view.renderer( components[componentId].component.model );

        if ( view.destinationInsertionFunction ){
          // TODO
          if ( 1 || $(dest)[0].hasOwnProperty(view.destinationInsertionFunction) ){
//          debug('using destinationInsertionFunction "' + view.destinationInsertionFunction + '"');
            $(dest)[view.destinationInsertionFunction]( _html );
          } else {
            debug('renderComponent(): jquery doesn\'t support destinationInsertionFunction "' +
            view.destinationInsertionFunction + '", component id = ' + componentId);
          }
        } else {
          $(dest).html( _html );
        }
      } else {
        debug('renderComponent(): no renderer view #' + i + ' in component id ' + componentId);
      }
    }
 
    // allow having both a renderer and a template function

    if ( typeof(view.template) !== "undefined" ){
      var templEl = $( view.template );
      if ( templEl.length > 0 ){
        view.template( components[i].component.model );
      } else {
        // TODO - just give warning first time
        debug('renderComponent(): could not find template ' + 
              'in DOM for componentId ' + componentIdi +'. Skipping');
      }
    }
  }

  // TODO
  function _sync_if_needed(component){
      var syncs = component.model_server_sync_keys;
console.log("_sync_if_needed(), component:");
      if ( syncs && typeof(syncs) !== "undefined" && syncs.length > 0 ){
        // TODO - find changed model key
        var changed_key = "forceWallActive";

        // check if changed model key is in the list of syncable keys
        var do_sync = false;
        for ( i = 0; i < syncs.length; i++ ){
          // found a syncable changed key, send the whole syncable model -
          // any other changed keys will be synced as well
          if ( syncs[i] === changed_key ){
console.log(syncs[i] + "===" + changed_key);
            do_sync = true;
            break;
          }
        }

        if (do_sync){
console.log('doing sync');
          var vals = _generate_sync_values(component);
console.log(vals);

          if ( typeof(component.model_server_sync_send) !== "undefined" ){
            // TODO - use model_server_sync_send() function to create message
            //        and send to the server
            component.model_server_sync_send( vals );
          } else {
            debug("checkForStateChanges(): component #" + i + " has keys that " +
                  "need to be synced with the server, but there is no " +
                  "model_server_sync_send() function");
          }
        }
      }
  }

  // generate array of syncable values that will be later sent to the server
  function _generate_sync_values(component){

    var model_copy = jQuery.extend(true, {}, component.model);
    var vals = [];

    var sync_keys = component.model_server_sync_keys;
    if ( typeof(sync_keys) !== "undefined"){
      for (var i = 0; i < sync_keys.length; i++){
        vals.push({'key':sync_keys[i], 'value':model_copy[sync_keys[i]]});
      }
    }

    /*
    component.model_server_sync_all_but_these_keys = [ 'settingsVisible' ];
    */

    return vals;
  }


  // compare the previous state of each component to the current state. If there has been a
  // state change, re-render the component
  function checkForStateChanges(){
console.log("checkForStateChanges()");
    for ( var i = 0; i < componentCounter; i++ ){
      // compare states to prev states
      if ( components[i]._internal.active ){
        if ( JSON.stringify(     components[i].component.model ) !==
             JSON.stringify( prevComponents[i].component.model ) ){
          debug('state change component #' + i + ' "' + components[i].name + '"');

          // check if we need to synchronize
console.log('calling _sync_if_needed on component ' + i);
          _sync_if_needed(components[i].component);

          renderComponent(i);
        }
      }
    }

    /* TODO - this might be heinously inefficient in the future, consider
              modifying only the changed models */
    updatePrevComponents();
  }

  function _add_adapters(_that, component_id, adapterz){
      if ( typeof(adapterz) !== "undefined" && adapterz.length > -1 ){

        // loop on the adapters
        for ( var i = 0; i < adapterz.length; i++ ){
          var a = adapterz[i];

          // run adapter function with this mapped to the DOM element
          if ( typeof(a) !== 'undefined' ){
            if ( !a.type || a.type === "" ){
              console.log('addComponent(): component with id "' + component_id +
                          '" has adapter id "' + a + '" with no type. Ignoring');
            }

            else if ( a.type === "jquery-click" ){
              var options = {
                'componentId':component_id,
                'callback':a.callback,
                '__setState':_that.setComponentState,
                'setComponentState':function(newModel){
//                 console.log('event.data.component #' + component_id);
                   this.__setState(component_id, newModel);
                }
              };

			  var checkState = checkForStateChanges;
              $('body').on('click', a.selector, options, function(event){
                // add the current component model to event.data, so the
                // component's adapter has access to the model
                event.data.model = _that.getComponentState(event.data.componentId).model;

                // invoke callback, passing event.data, which contains: model, setComponentState
                event.data.callback(event.data); // event.data contains options (model, setComponentState)

                checkState();
              });
            }


            else {
              console.log('addComponent(): component with id "' + component_id +
                          '" has adapter id "' + a + '" with unrecognized type: "' +
                          a.type + '". Ignoring');
            }
          }

          // TODO - when event is triggered, try to trigger render immediately
        }
      }
  }


  // ** entry point for MVA intialization ** //
  if (isStarted){
    return 0;
  } else {
    // initialization stuff here
    debug('starting mva');

    // copy the components (for model/state comparison)
    // TODO - this is probably unneeded
    prevComponents = $.extend(true, {}, components);

    // set watcher for state changes
    changeWatchInterval = setInterval( checkForStateChanges, _options.watchTimeout );
    isStarted = 1;
  }


  // public functions //

  this.addComponent = function( component ){

      /* addComponent will look for three components: model, view (renderer or template), and
         adapters, if any */

      if ( typeof(component.model) === "undefined" ){
        debug('MVA.addcomponent(): component is missing a model');
        return -1;
      }

      if ( typeof(component.views) === "undefined" || component.views.length <= 0 ){
        debug('MVA.addcomponent(): component is missing a view');
        return -1;
      } else {
        /* check for destination and renderer or template */
      }

      if ( !component.adapterz || component.adapterz.length <= 0 ){
        debug('MVA.addcomponent(): warning component is missing an adapter. Continuing anyway');
      }

      // check for synchronization for model to server
      if ( typeof(component.model_server_sync_keys) !== "undefined" &&
           component.model_server_sync_keys.length > -1 ){
        debug('component with id "' + newId + '" has ' + component.model_server_sync_keys.length + ' model_server_sync_keys ');
        // TODO - ensure sync keys are actually in the model
      }


      componentCounter++;
      var newId = componentCounter - 1;
      var copy = jQuery.extend(true, {}, component);

      debug('adding new component (#' + newId + ')');
      debug(component);

      components.push({ 
        name:component.constructor.name,
        component:copy,
        _internal:{ id:newId, active:true }
      });

      updatePrevComponents();
      renderComponent( newId );
      
      // add adapters, events which affect the model
      _add_adapters(this, newId, component.adapterz);



      return newId;
  };

  this.removeComponent = function( componentId ){
    if ( !validateComponentId(componentId) ){
      debug('removeComponent(): component with id "' + componentId + '" is not defined');
      return;
    }

    // TODO
    components[componentId] = undefined;
    componentCounter--;
  };

  this.pauseComponent = function( componentId ){
    // TODO - stop listeners on state
    if ( !validateComponentId(componentId) ){
      debug('pauseComponent(): component with id "' + componentId + '" is not defined');
      return;
    }

    components[componentId]._internal.active = false;
  };

  this.startComponent = function( componentId ){
    // TODO - start listeners on state
    if ( !validateComponentId(componentId) ){
      debug('startComponent(): component with id "' + componentId + '" is not defined');
      return;
    }
    components[componentId]._internal.active = true;
  };

  this.getComponentState = function( componentId ){
    // return a copy of the model
    if ( !validateComponentId(componentId) ){
      debug('getComponentState(): component with id "' + componentId + '" is not defined');
      return;
    }
    var copy = jQuery.extend(true, {}, components[componentId].component);
    return copy;
  };

  this.setComponentState = function( componentId, newState){
    if ( !validateComponentId(componentId) ){
      debug('setComponentState(): component with id "' + componentId + '" is not defined');
      return;
    }
    /* debug('setComponentState: setting component ' + componentId + ' state. Old model: ');
    debug( components[componentId].component.model ); */

    components[componentId].component.model = jQuery.extend(true, {}, newState);

    /* debug('setComponentState: setting component ' + componentId + ' state. New model: ');
    debug( components[componentId].component.model ); */

    // TODO - render only if state is different
    renderComponent(componentId);
  };

  // TODO - how should this be different from the previous function?
  this.changeComponentModel = function( componentId, newModel ){
    // TODO = clone and use a new model for the component
    if ( !validateComponentId(componentId) ){
      debug('changeComponentState(): component with id "' + componentId + '" is not defined');
      return;
    }
  };

  this.getComponentViews = function( componentId ){
    // return a copy of the views
    if ( !validateComponentId(componentId) ){
      debug('getComponentViews(): component with id "' + componentId + '" is not defined');
      return;
    }

    var copy = jQuery.extend(true, {}, components[i].component.views);
    return copy;
  };

  // TODO - change name to setComponentViews?
  this.changeComponentViews = function( componentId, newViews ){
    // clone and use new views for the component
    if ( !validateComponentId(componentId) ){
      debug('changeComponentViews(): component with id "' + componentId + '" is not defined');
      return;
    }

    components[i].component.views = jQuery.extend(true, {}, newViews);
  };

  this.getComponentViews = function( componentId ){
    // return a copy of the adapters
    if ( !validateComponentId(componentId) ){
      debug('getComponentViews(): component with id "' + componentId + '" is not defined');
      return;
    }

    var copy = jQuery.extend(true, {}, components[i].component.adapterz);
    return copy;
  };

  // TODO - change name to setComponentAdapters?
  this.changeComponentAdapters = function( componentId, newAdapters ){
    // clone and use new adapters for the component
    if ( !validateComponentId(componentId) ){
      debug('changeComponentAdapters(): component with id "' + componentId + '" is not defined');
      return;
    }

    components[i].component.adapterz = jQuery.extend(true, {}, newAdapters);
  }

}
