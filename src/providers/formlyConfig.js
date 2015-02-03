let angular = require('angular-fix');

module.exports = ngModule => {
  ngModule.provider('formlyConfig', formlyConfig);

  formlyConfig.tests = ON_TEST ? require('./formlyConfig.test')(ngModule) : null;

  function formlyConfig(formlyUsabilityProvider) {

    var typeMap = {};
    var templateWrappersMap = {};
    var defaultWrapperName = 'default';
    var _this = this;
    var getError = formlyUsabilityProvider.getFormlyError;

    angular.extend(this, {
      setType: setType,
      getType: getType,
      setWrapper: setWrapper,
      getWrapper: getWrapper,
      getWrapperByType: getWrapperByType,
      disableWarnings: false,
      $get: () => this
    });

    function setType(options) {
      if (angular.isArray(options)) {
        angular.forEach(options, setType);
      } else if (angular.isObject(options)) {
        checkType(options);
        typeMap[options.type] = options;
      } else {
        throw getError(`You must provide an object or array for setType. You provided: ${JSON.stringify(arguments)}`);
      }
    }

    function getType(type) {
      return typeMap[type];
    }

    function checkType(options) {
      if (!options.type) {
        throw getError(`You must provide a type for setType. You provided: ${JSON.stringify(arguments)}`);
      } else if (!options.template && !options.templateUrl) {
        throw getError(
          `You must provide a template OR templateUrl for setType. You provided neither: ${JSON.stringify(arguments)}`
        );
      } else if (options.template && options.templateUrl) {
        throw getError(
          `You must provide a template OR templateUrl for setType. You provided both: ${JSON.stringify(arguments)}`
        );
      }
      checkOverwrite(options.type, typeMap, options, 'types');
    }

    function setWrapper(options, name) {
      if (angular.isArray(options)) {
        return options.map(wrapperOptions => setWrapper(wrapperOptions));
      } else if (angular.isObject(options)) {
        options.types = getOptionsTypes(options);
        options.name = getOptionsName(options, name);
        checkWrapperAPI(options);
        templateWrappersMap[options.name] = options;
        return options;
      } else if (angular.isString(options)) {
        return setWrapper({
          template: options,
          name
        });
      }
    }

    function getOptionsTypes(options) {
      if (angular.isString(options.types)) {
        return [options.types];
      }
      if (!angular.isDefined(options.types)) {
        return [];
      } else {
        return options.types;
      }
    }

    function getOptionsName(options, name) {
      return options.name || name || options.types.join(' ') || defaultWrapperName;
    }

    function checkWrapperAPI(options) {
      formlyUsabilityProvider.checkWrapper(options);
      if (options.template) {
        formlyUsabilityProvider.checkWrapperTemplate(options.template, options);
      }
      checkOverwrite(options.name, templateWrappersMap, options, 'templateWrappers');
      checkWrapperTypes(options);
    }

    function checkWrapperTypes(options) {
      let shouldThrow = !angular.isArray(options.types) || !options.types.every(angular.isString);
      if (shouldThrow) {
        throw getError(`Attempted to create a template wrapper with types that is not a string or an array of strings`);
      }
      let wrapperWithSameType = options.types.some(getWrapperByType);
      if (wrapperWithSameType) {
        throw getError([
          `Attempted to create a template wrapper with types that have already been specified for another template.`,
          `Original wrapper: ${JSON.stringify(wrapperWithSameType)}, you specified: ${JSON.stringify(options)}`
        ].join(' '));
      }
    }

    function checkOverwrite(property, object, newValue, objectName) {
      if (object.hasOwnProperty(property)) {
        warn([
          `Attempting to overwrite ${property} on ${objectName} which is currently`,
          `${JSON.stringify(object[property])} with ${JSON.stringify(newValue)}`
        ].join(' '));
      }
    }

    function getWrapper(name) {
      return templateWrappersMap[name || defaultWrapperName];
    }

    function getWrapperByType(type) {
      for (var name in templateWrappersMap) {
        if (templateWrappersMap.hasOwnProperty(name)) {
          if (templateWrappersMap[name].types && templateWrappersMap[name].types.indexOf(type) !== -1) {
            return templateWrappersMap[name];
          }
        }
      }
    }

    function warn() {
      if (!_this.disableWarnings) {
        console.warn(...arguments);
      }
    }


  }
};
