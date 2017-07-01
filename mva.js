

// constructor
function MVA(options){
  var componentCounter = 0;
  var components = [];
  var prevComponents = [];
  var changeWatchInterval;
  var debugLevel = -1;


  // TODO - fix line numbers
  function debug(message, messageLevel){
    if (typeof(messageLevel) === 'undefined'){
      messageLevel = 0;
    }

    if (debugLevel >= messageLevel){
      console.log(message);
    }
  }

  debug('MVA options:');
  debug(options);

  var _options = Object.assign(
    {
      watchTimeout:500 // milliseconds
    }, options );

  var isStarted = 0;

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
            debug('using destinationInsertionFunction "' + view.destinationInsertionFunction + '"');
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

    if ( view.template ){
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

  // compare the previous state of each component to the current state. If there has been a
  // state change, re-render the component
  function checkForStateChanges(){
    for ( var i = 0; i < componentCounter; i++ ){
      // compare states to prev states
      if ( components[i]._internal.active ){
        if ( JSON.stringify(     components[i].component.model ) !==
             JSON.stringify( prevComponents[i].component.model ) ){
          debug('state change component #' + i + ' "' + components[i].name + '"');
          renderComponent(i);
        }
      }
    }

    /* TODO - this might be heinously inefficient in the future, consider
              modifying only the changed models */
    updatePrevComponents();
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

      if ( !component.model ){
        debug('MVA.addcomponent(): component is missing a model');
      }

      if ( !component.views || component.views.length <= 0 ){
        debug('MVA.addcomponent(): component is missing a view');
        return -1;
      } else {
        /* check for destination and renderer or template */
      }

      if ( !component.adapters || component.adapters.length <= 0 ){
        debug('MVA.addcomponent(): warning component is missing an adapter. Continuing anyway');
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

console.log(components[components.length - 1]._internal);
      updatePrevComponents();
      renderComponent( newId );
      

      // add adapters, events which affect the model
      // TODO - BOB - events don't seem to be applied via $.on() if the component hasn't rendered 
      //              properly yet
      var adapters = component.adapters;
      if ( adapters ){

        // loop on the adapters
        for ( var i = 0; i < adapters.length; i++ ){

          // run adapter function with this mapped to the DOM element
          // TODO - is this realistic? will the element be guaranteed to exist at this point?
          // TODO - how do we map view destinations to adapters?
          if ( adapters[i] ){
            adapters[i]( newId, component.views, component.model, this.setComponentState );
          }

          // TODO - when event is triggered, try to trigger render immediately
        }
      }

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
    var copy = jQuery.extend(true, {}, components[i].component.model);
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

    var copy = jQuery.extend(true, {}, components[i].component.adapters);
    return copy;
  };

  // TODO - change name to setComponentAdapters?
  this.changeComponentAdapters = function( componentId, newAdapters ){
    // clone and use new adapters for the component
    if ( !validateComponentId(componentId) ){
      debug('changeComponentAdapters(): component with id "' + componentId + '" is not defined');
      return;
    }

    components[i].component.adapters = jQuery.extend(true, {}, newAdapters);
  }

}
