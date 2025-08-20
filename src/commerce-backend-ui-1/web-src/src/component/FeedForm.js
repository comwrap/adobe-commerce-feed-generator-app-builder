import React from 'react'
import {
    View, Flex, Content, Heading, Divider, Section, Text,
    Button,
    Dialog, DialogTrigger, DialogContainer, AlertDialog,
    Form, TextField, Picker, ListView,
    ButtonGroup, ActionButton,
    Item, Tabs, TabList, TabPanels,
    ProgressBar,
    TableView, TableHeader, Column, TableBody, Row, Cell,
    Link, StatusLight, Tooltip, TooltipTrigger
} from '@adobe/react-spectrum'
import Delete from '@spectrum-icons/workflow/Delete'
import Refresh from '@spectrum-icons/workflow/Refresh'
import InfoOutline from '@spectrum-icons/workflow/InfoOutline'
import CodeEditor from "./CodeEditor"
import {ToastQueue} from '@react-spectrum/toast'
import moment from "moment";


import {invokeAction} from '../utils'
import {validateStateAgainstValue, validateFeedForm} from './validators/FormValidator'
import zlib from 'react-zlib-js/index';
import buffer from 'react-zlib-js/buffer';
import { attach } from '@adobe/uix-guest'

class FeedForm extends React.Component {
    static scheduleDaysOptions = [
        {key: 'monday', name: 'Monday'},
        {key: 'tuesday', name: 'Tuesday'},
        {key: 'wednesday', name: 'Wednesday'},
        {key: 'thursday', name: 'Thursday'},
        {key: 'friday', name: 'Friday'},
        {key: 'saturday', name: 'Saturday'},
        {key: 'sunday', name: 'Sunday'},
    ];

    constructor(props) {
        super(props);
        const feedTypeOptionsArr = [
            {title: 'XML', id: 'xml'}
            // {title: 'JSON', id: 'json'},
            // {title: 'CSV', id: 'csv'},
        ];
        const feedTypeListFlatArr = {
            'xml': 'XML'
            // 'json': 'JSON',
            // 'csv': 'CSV'
        };
        this.state = {
            loading: true,
            headers: {},
            feedName: '',
            feedHeader: '',
            filterQuery: '',
            searchQuery: '',
            feedBody: '',
            feedFooter: '',
            storeCodeKey: '',
            storeCodeName: '',
            feedTypeKey: null,
            scheduleTypeKey: null,
            scheduleTime: '',
            scheduleTimesOptions: this.generateScheduleTimesOptions(),
            scheduleDaysSelectedKeys: [],
            scheduleTimesSelectedKeys: [],
            feedTypeName: null,
            productTypes: [],
            uuid: '',
            feedData: {},
            storeListOptions: [],
            storeListFlat: [],
            autocompleteList: [],
            feedTypeOptions: feedTypeOptionsArr,
            feedTypeListFlat: feedTypeListFlatArr,
            disabled: false,
            isNewFeed: true,
            saveButtonDisabled: false,
            feedInformation: [],
            flattened: [],
            isFieldNameValid: null,
            isFieldTypeValid: null,
            isFieldStoreValid: null,
            isFieldBodyValid: null,
            meshQueryUrl: '',
            meshApiKey: '',
            acApiKey: '',
            acGqlStoreCode: '',
        };
        this.handleCancel = this.handleCancel.bind(this);
        this.storeCodeOnSelectionChange = this.storeCodeOnSelectionChange.bind(this);
        this.handleSave = this.handleSave.bind(this);
        // this.storeCodeOnInputChange = this.storeCodeOnInputChange.bind(this);
    }

    async componentDidMount() {
        const self = this;
        let isNew = true;

         if (!this.props.ims.token) {
            console.log('No IMS token found, attaching to guest connection. FeedForm.js. componentDidMount ...')
            const guestConnection = await attach({ id: 'feedGenerator' });
            console.log('Guest connection established FeedForm.js:', guestConnection);
            this.props.ims.token = guestConnection?.sharedContext?.get('imsToken');
            console.log('IMS token FeedForm.js:', this.props.ims.token);
            this.props.ims.org = guestConnection?.sharedContext?.get('imsOrgId');
            console.log('IMS org FeedForm.js:', this.props.ims.org);
        }

        //load data for existing feed
        if (self.props.feedUuid !== undefined
            && self.props.feedUuid !== null
            && self.props.feedUuid !== ''
            && self.props.feedUuid !== 'undefined'
            && typeof self.props.feedUuid !== 'undefined') {
            self.setState({
                loading: true,
                isNewFeed: false
            });
            isNew = false;
        } else {
            //load data required for new or existing feed
            self.setState({
                isNewFeed: true
            });
        }

        this.fetchData(isNew).then(response => {
            console.log('form data loaded')
        }).catch(err => {
            console.error('Error:', err)
        }).finally(() => {
            self.setState({
                loading: false
            });
        });
        document.addEventListener('keydown', this.handleCtrlSKeyDown);
    }

    componentWillUnmount() {
        document.removeEventListener('keydown', this.handleCtrlSKeyDown);
    }

    handleCtrlSKeyDown = (event) => {
        if (event.ctrlKey && (event.key === 's' || event.key === 'S')) {
            event.preventDefault(); // Prevent the default behavior of saving the entire page
            this.handleSave();
        }
    };

    generateScheduleTimesOptions() {
        const options = [];
        const startTime = new Date();
        startTime.setHours(0, 0, 0, 0); // Set to the beginning of the day

        const endTime = new Date();
        endTime.setHours(23, 59, 59, 999); // Set to the end of the day

        const intervalMinutes = 30;
        let currentTime = new Date(startTime);

        while (currentTime <= endTime) {
            const key = currentTime.toTimeString().slice(0, 5);
            const name = currentTime.toLocaleTimeString('en-US', {hour: 'numeric', minute: '2-digit'});

            options.push({key, name});

            currentTime.setMinutes(currentTime.getMinutes() + intervalMinutes);
        }
        // console.log(options)
        return options;
    }

    async fetchData(isNew) {
        // trick to remove feed by uuid if feedlist not loads because of corrupted data
        // this.deleteFeedByUuid("01018dcf-2d90-44a0-8f0c-d0a90e85aee5");
        if (isNew === true) {
            console.log('fetch data for "New feed"');

            const [stores, listObject] = await Promise.all([
                this.getStores(),
                this.getSubTypesForObject("ProductView")
            ])
            this.setState({
                autocompleteList: listObject
            });
            return [stores, listObject];
        }

        console.log('fetch data for "Existing feed"');
        const [stores, listObject, feed] = await Promise.all([
            this.getStores(),
            this.getSubTypesForObject("ProductView"),
            this.getFeedByUuid(this.props.feedUuid)
        ])
        this.setState({
            autocompleteList: listObject
        });

        return [stores, listObject, feed];
    }

    getHeaders() {
        const headersData = {}
        if (this.props.ims.token && !headersData.authorization) {
            headersData.authorization = 'Bearer ' + this.props.ims.token
        }
        if (this.props.ims.org && !headersData['x-gw-ims-org-id']) {
            headersData['x-gw-ims-org-id'] = this.props.ims.org
        }
        // console.log("getHeaders:", headersData);
        return headersData;
    }

    async getFeedByUuid(feedUuid) {
        const headers = this.getHeaders();
        const params = {"uuid": feedUuid}

        try {
            const feedInformation = await invokeAction('feed-generator/getFeedByUuid', headers, params, this.props)

            //general
            this.feedNameChange(feedInformation['value']['feedName']);
            this.feedHeaderChange(feedInformation['value']['feedHeader']);
            this.feedBodyChange(feedInformation['value']['feedBody']);
            this.feedFooterChange(feedInformation['value']['feedFooter']);

            this.storeCodeOnSelectionChange(feedInformation['value']['store_code']);
            this.feedTypeOnSelectionChange(feedInformation['value']['feed_type']);

            //product filtering
            this.feedSearchQueryChange(feedInformation['value']['searchQuery']);
            this.feedFilterQueryChange(feedInformation['value']['filterQuery']);

            //settings
            this.meshQueryUrlChangeSetting(feedInformation['value']['meshQueryUrl']);
            this.meshApiKeyChangeSetting(feedInformation['value']['meshApiKey']);
            this.acApiKeyChangeSetting(feedInformation['value']['acApiKey']);
            this.acGqlStoreCodeChangeSetting(feedInformation['value']['acGqlStoreCode']);

            //schedule
            var scheduleType = feedInformation['value']['schedule_type'];
            this.scheduleTypeOnSelectionChange(scheduleType);
            if (scheduleType === undefined || scheduleType == '') {
                this.scheduleTypeOnSelectionChange('manually');
            }

            var days = [];
            var feedDays = feedInformation['value']['schedule_days']
            if (feedDays !== undefined && typeof feedDays !== 'undefined' && feedDays !== '') {
                feedDays = feedDays.split(",");
                for (var i = 0; i < feedDays.length; i++) {
                    days.push(feedDays[i]);
                }
            }
            this.scheduleDaysOnSelectionChange(days);
            var times = [];
            var savedTimes = feedInformation['value']['schedule_times']
            if (savedTimes !== undefined && typeof savedTimes !== 'undefined' && savedTimes !== '') {
                savedTimes = savedTimes.split(",");
                for (var i = 0; i < savedTimes.length; i++) {
                    times.push(savedTimes[i]);
                }
            }
            this.scheduleTimesOnSelectionChange(times);

            feedInformation['value']['id'] = feedUuid

            this.setState({feedInformation: [feedInformation['value']]})

            return this.state.feedData;
        } catch (e) {
            console.error(e)
            this.setState({feedData: null, actionResponseError: e.message, actionInvokeInProgress: false})
            return [];
        }
    }

    async deleteFeedByUuid(feedUuid) {
        const headers = this.getHeaders();
        const params = {"uuid": feedUuid}
        const self = this;

        try {
            self.setState({
                loading: true
            });

            await invokeAction('feed-generator/deleteFeed', headers, params, this.props).then(response => {
                ToastQueue.neutral('Feed deleted.', {timeout: 5000});

                self.reloadFeedTable();
                self.setState({isOpen: false});
                self.handleCancel();
            }).catch(err => {
                ToastQueue.negative("Can't delete feed.", {timeout: 5000})
            }).finally(() => {
                self.setState({
                    loading: false
                });
            });
            return true;
        } catch (e) {
            console.error(e)
            this.setState({feedData: null, actionResponseError: e.message, actionInvokeInProgress: false})
            return false;
        }
    }

    async regenerateFeedByUuid(feedUuid) {
        const headers = this.getHeaders();
        const params = {"uuid": feedUuid}
        const self = this;

        try {
            self.setState({
                loading: true
            });

            await invokeAction('feed-generator/regenerateFeed', headers, params, this.props).then(response => {
                console.log('feed regeneration started')
                ToastQueue.positive("Feed regeneration scheduled.", {timeout: 5000})
            }).catch(err => {
                ToastQueue.negative("Can't schedule feed regeneration.", {timeout: 5000})
            }).finally(() => {
                this.getFeedByUuid(feedUuid);
                self.setState({
                    loading: false
                });
            });
            return true;
        } catch (e) {
            console.error(e)
            this.setState({feedData: null, actionResponseError: e.message, actionInvokeInProgress: false})
            return false;
        }
    }

    async getStores() {

        const headers = this.getHeaders();
        const params = {}

        try {

            const websitesToStoreViewsList = await invokeAction('feed-generator/getAllStores', headers, params, this.props)
            console.log(`All stores action response:`, websitesToStoreViewsList)

            if (websitesToStoreViewsList[0]?.items[0]?.code === undefined) {
                ToastQueue.negative("Cannot receive list of Commerce Stores, check your API", {timeout: 5000})
                this.setState({storeListOptions: [], actionResponseError: "Cannot receive list of Commerce Stores, check your API", actionInvokeInProgress: false})
                return [];
            }

            const storesData = [];
            const storesFlat = [];
            let i = 1;
            for (let i = 0; i < websitesToStoreViewsList.length; i++) {
                let storesChildren = [];
                let groupName = websitesToStoreViewsList[i]['name'];

                for (let j = 0; j < Object.keys(websitesToStoreViewsList[i]['items']).length; j++) {
                    storesChildren.push({
                        code: websitesToStoreViewsList[i]['items'][j]['code'],
                        name: websitesToStoreViewsList[i]['items'][j]['name']
                    });
                    storesFlat[websitesToStoreViewsList[i]['items'][j]['code']] = websitesToStoreViewsList[i]['items'][j]['name'];
                }
                storesData.push({
                    name: groupName,
                    children: storesChildren
                });
            }
            console.log(`stores data:`, storesData);
            console.log(`storesFlat data:`, storesFlat);
            this.setState({storeListOptions: storesData, storeListFlat: storesFlat});
            console.log(`storesFlat state data:`, this.state.storeListFlat);

            return storesData
        } catch (e) {
            console.error(e)
            this.setState({storeListOptions: [], actionResponseError: e.message, actionInvokeInProgress: false})
            return [];
        }
    }

    flattenArray(inputArray) {
        const result = [];

        function flatten(obj, prefix) {
            Object.keys(obj).forEach((key) => {
                const propName = prefix ? `${prefix}.${key}` : key;
                if (typeof obj[key] === "object" && obj[key] !== null) {
                    flatten(obj[key], propName);
                } else {
                    result.push(propName);
                }
            });
        }

        inputArray.forEach((str) => {
            const keys = str.split(".");
            let obj = {};
            keys.reverse().forEach((key) => {
                obj = {[key]: obj};
            });
            flatten(obj, "");
        });
        return result;
    }

    createNestedObject(inputArray) {
        const resultObject = {};

        for (const key of inputArray) {
            const nestedKeys = key.split('.');

            let currentLevel = resultObject;
            for (let i = 0; i < nestedKeys.length; i++) {
                const nestedKey = nestedKeys[i];

                if (!currentLevel[nestedKey]) {
                    currentLevel[nestedKey] = {};
                }

                if (i === nestedKeys.length - 1) {
                    currentLevel[nestedKey] = null;
                }

                currentLevel = currentLevel[nestedKey];
            }
        }

        return resultObject;
    }

    convertPriceObjects(obj) {
        const convertedObj = {};

        for (const key in obj) {
            if (key === "discount") {
                if (!convertedObj.hasOwnProperty('price_range')) {
                    convertedObj.price_range = convertedObj.price_range || {};
                }
                convertedObj.price_range.maximum_price = {
                    discount: {
                        percent_off: obj[key].percent_off,
                        amount_off: obj[key].amount_off
                    }
                };
                convertedObj.price_range.minimum_price = {
                    discount: {
                        percent_off: obj[key].percent_off,
                        amount_off: obj[key].amount_off
                    }
                };
            } else if (key === "final_price") {
                if (!convertedObj.hasOwnProperty('price_range')) {
                    convertedObj.price_range = convertedObj.price_range || {};
                }
                convertedObj.price_range.maximum_price[key] = {
                    currency: obj[key].currency,
                    value: obj[key].value
                };
                convertedObj.price_range.minimum_price[key] = {
                    currency: obj[key].currency,
                    value: obj[key].value
                };
            } else if (key === "maximum_price" || key === "minimum_price") {
                if (!convertedObj.price_range.hasOwnProperty(key)) {
                    convertedObj.price_range = convertedObj.price_range || {};
                    convertedObj.price_range[key] = this.convertPriceObjects(obj[key]);
                }
            } else {
                if (key !== "price_range") {
                    convertedObj[key] = obj[key];
                }
            }
        }

        return convertedObj;
    }

    convertObjectToStrings(obj, parentKey = '') {
        let strings = [];

        for (let key in obj) {
            if (obj.hasOwnProperty(key)) {
                const value = obj[key];
                const currentKey = parentKey ? `${parentKey}.${key}` : key;

                if (typeof value === 'object' && !Array.isArray(value) && value !== null) {
                    const nestedStrings = this.convertObjectToStrings(value, currentKey);
                    strings = strings.concat(nestedStrings);
                } else {
                    strings.push(currentKey);
                }
            }
        }

        return strings;
    }

    async getSubTypesForObject(name, withCategories = true, autocompletionList = []) {

        const gqlSchema = await this.getGqlSchemaData();

        const config = await this.getApplicationConfig();

        // console.log("gqlSchema", gqlSchema);

        const productType = gqlSchema.data.__schema.types.find(type => type.name === name);
        const productFields = productType.fields;
        const productPossibleTypes = productType.possibleTypes;

        // console.log("productFields", productFields);
        // console.log("productPossibleTypes", productPossibleTypes);

        // Instead of using the complex subFields extraction, let's build paths directly
        const allPaths = [];
        this.extractAllPaths(productFields, gqlSchema, allPaths);

        const attributeCodes = this.extractAttributeCodes(productFields, gqlSchema);
        const mergedAttributes = [...attributeCodes, ...allPaths];

        // Process productPossibleTypes and add their fields with type prefix
        if (productPossibleTypes && productPossibleTypes.length > 0) {
            for (const possibleType of productPossibleTypes) {
                const typeName = possibleType.name;
                const typeFields = gqlSchema.data.__schema.types.find(type => type.name === typeName);
                
                if (typeFields && typeFields.fields) {
                    console.log(`Processing possible type: ${typeName}`);
                    
                    // Extract all paths for this type
                    const typePaths = [];
                    this.extractAllPaths(typeFields.fields, gqlSchema, typePaths);
                
                    // Add direct fields with type prefix
                    const typeAttributeCodes = this.extractAttributeCodes(typeFields.fields, gqlSchema);
                    typeAttributeCodes.forEach(fieldName => {
                        mergedAttributes.push(`${typeName}.${fieldName}`);
                    });
                    
                    // Add all nested paths with type prefix
                    typePaths.forEach(path => {
                        mergedAttributes.push(`${typeName}||${path}`);
                    });

                }
            }
        }

        mergedAttributes.sort();
        const inputObj = this.createNestedObject(mergedAttributes);

        if (withCategories && config.ims !== true) {
            const catFields = gqlSchema.data.__schema.types.find(type => type.name === "CategoryInterface").fields;
            const catPaths = [];
            this.extractAllPaths(catFields, gqlSchema, catPaths);
            
            const catAttributeCodes = this.extractAttributeCodes(catFields, gqlSchema);
            const mergedCatAttributes = [...catAttributeCodes, ...catPaths];
            mergedCatAttributes.sort();

            inputObj['categories'] = this.createNestedObject(mergedCatAttributes);
        }

        const convertedObj = this.convertPriceObjects(inputObj);
        const stringsArray = this.convertObjectToStrings(convertedObj);

        for (const element of stringsArray) {
            autocompletionList[autocompletionList.length] = "{{" + element + "}}"
        }
        return autocompletionList;
    }

    extractAllPaths(fields, gqlSchema, allPaths, currentPath = '', maxDepth = 5, currentDepth = 0) {
        if (!fields || currentDepth >= maxDepth) {
            return;
        }

        fields.forEach(field => {
            if (field.isDeprecated) {
                return;
            }

            const fieldPath = currentPath ? `${currentPath}.${field.name}` : field.name;
            
            // Helper function to process a type
            const processType = (type, path) => {
                if (type.kind === 'OBJECT' && !this.isCircularReference(type.name, currentPath)) {
                    const subTypeFields = gqlSchema.data.__schema.types.find(t => t.name === type.name)?.fields;
                    if (subTypeFields) {
                        this.extractAllPaths(subTypeFields, gqlSchema, allPaths, path, maxDepth, currentDepth + 1);
                    }
                } else if (type.kind === 'SCALAR' || type.kind === 'ENUM') {
                    // Add both SCALAR and ENUM types as valid paths
                    allPaths.push(path);
                } else if (type.kind === 'LIST') {
                    if (type.ofType.kind === 'OBJECT' && !this.isCircularReference(type.ofType.name, currentPath)) {
                        const subTypeFields = gqlSchema.data.__schema.types.find(t => t.name === type.ofType.name)?.fields;
                        if (subTypeFields) {
                            this.extractAllPaths(subTypeFields, gqlSchema, allPaths, path, maxDepth, currentDepth + 1);
                        }
                    } else if (type.ofType.kind === 'SCALAR' || type.ofType.kind === 'ENUM') {
                        // Add SCALAR and ENUM types in lists
                        allPaths.push(path);
                    }
                } else if (type.kind === 'NON_NULL') {
                    // Recursively process the ofType
                    processType(type.ofType, path);
                }
            };

            // Process the field type
            processType(field.type, fieldPath);
        });
    }

    // Add this helper method to prevent infinite recursion
    isCircularReference(typeName, currentPath) {
        // Only prevent circular references for the same type appearing in its own path
        // Make the check more specific to avoid blocking valid nested structures
        const pathSegments = currentPath.split('.');
        const typeOccurrences = pathSegments.filter(segment => 
            segment.toLowerCase().includes(typeName.toLowerCase().replace('interface', ''))
        ).length;
        
        // Allow up to 2 occurrences of the same type in a path
        return typeOccurrences >= 2;
    }

    async getGqlSchemaData() {
        // Check if the schema is already in the cache
        const cacheKey = 'feeder-gql-schema'
        const cachedSchema = sessionStorage.getItem(cacheKey)

        if (cachedSchema) {
            console.log('Using cached schema')
            let schema = JSON.parse(cachedSchema)
            if (schema && schema.data && schema.data.__schema) {
                return schema
            } else {
                console.log("Cached GQL schema corrupted. Updating from server.");
                sessionStorage.removeItem(cacheKey);
            }
        }

        // Fetch the schema from the server
        console.log('Fetching schema from server');
        const headers = this.getHeaders();
        const schema = await invokeAction('feed-generator/getGqlSchema', headers, {}, this.props);
        console.log("Schema response: " + schema);

        const compressed = buffer.from(schema, 'base64');
        const decompressed = zlib.inflateRawSync(compressed);
        const decompressedString = decompressed.toString();

        sessionStorage.setItem(cacheKey, decompressedString);

        return JSON.parse(decompressedString);
    }

    /**
     * Get Application Config
     * Currently used to get the ims flag
     */
    async getApplicationConfig() {

        // Check if the schema is already in the cache
        const cacheKey = 'feeder-config'
        const cachedConfig = sessionStorage.getItem(cacheKey)

        if (cachedConfig) {
            return JSON.parse(cachedConfig);
        }

        const headers = this.getHeaders();
        const config = await invokeAction('feed-generator/getConfig', headers, {}, this.props);
        
        sessionStorage.setItem(cacheKey, JSON.stringify(config));
        console.log("Config response: " + JSON.stringify(config));

        return config
    }

    extractSubFields(fields, gqlSchema, subFields, prefix = '') {
        if (!fields) {
            return;
        }
        fields.forEach(field => {
            if (field.type.kind === 'OBJECT' && !field.isDeprecated) {
                const typeName = field.type.name;
                const subTypeFields = gqlSchema.data.__schema.types.find(type => type.name === typeName).fields;
                subFields[field.name] = subTypeFields;
                this.extractSubFields(subTypeFields, gqlSchema, subFields, `${prefix}${field.name}.`);
            } else if (field.type.kind === 'LIST') { 
                if (field.type.ofType.kind === 'OBJECT') {
                        const ofTypeName = field.type.ofType.name;
                        const subTypeFields = gqlSchema.data.__schema.types.find(type => type.name === ofTypeName).fields;
                        subFields[field.name] = subTypeFields;
                        this.extractSubFields(subTypeFields, gqlSchema, subFields, `${prefix}${field.name}.`);
                }
            } else if (field.type.kind === 'NON_NULL') {
                if (field.type.ofType.kind === 'OBJECT') {
                    const ofTypeName = field.type.ofType.name;
                    const subTypeFields = gqlSchema.data.__schema.types.find(type => type.name === ofTypeName).fields;
                    subFields[field.name] = subTypeFields;
                    this.extractSubFields(subTypeFields, gqlSchema, subFields, `${prefix}${field.name}.`);
                }
            } 
        });
    }

    extractAttributeCodes(fields, gqlSchema, prefix = '') {
        if (!fields) {
            return [];
        }
        return fields.flatMap(field => {
            if (!field.type) {
                return [];
            } else if (field.type.kind === 'SCALAR') {
                return [`${prefix}${field.name}`];
            } else if (field.type.kind === 'NON_NULL') {
                return this.extractAttributeCodes([field.type.ofType], gqlSchema, prefix);
            } else if (field.type.kind === 'LIST') {
                return this.extractAttributeCodes([field.type.ofType], gqlSchema, `${prefix}${field.name}.`);
            } else if (field.type.kind === 'OBJECT') {
                return this.extractAttributeCodes(field.type.fields, gqlSchema, `${prefix}${field.name}.`);
            } else {
                return [];
            }
        });
    }

    //handle form fields
    feedNameChange = (value) => {
        let isFieldNameValid = "invalid"
        if (value != "") {
            isFieldNameValid = "valid"
        }
        this.setState({feedName: value, isFieldNameValid: isFieldNameValid});
        this.updateFeedData('feedName', value);
    }
    feedHeaderChange = (value) => {
        this.setState({feedHeader: value});
        this.updateFeedData('feedHeader', value);
    }
    feedBodyChange = (value) => {
        this.setState({feedBody: value});
        this.updateFeedData('feedBody', value);
    }
    feedFooterChange = (value) => {
        this.setState({feedFooter: value});
        this.updateFeedData('feedFooter', value);
    }
    productTypesChange = (value) => {
        this.setState({productTypes: [...value]});
        const types = (value.length > 0) ? value.join(',') : '';
        this.updateFeedData('productTypes', types);
    }
    feedSearchQueryChange = (value) => {
        this.setState({searchQuery: value});
        this.updateFeedData('searchQuery', value);
    }
    feedFilterQueryChange = (value) => {
        this.setState({filterQuery: value});
        this.updateFeedData('filterQuery', value);
    }
    meshQueryUrlChangeSetting = (value) => {
        this.setState({meshQueryUrl: value});
        this.updateFeedData('meshQueryUrl', value);
    }
    meshApiKeyChangeSetting = (value) => {
        this.setState({meshApiKey: value});
        this.updateFeedData('meshApiKey', value);
    }
    acApiKeyChangeSetting = (value) => {
        this.setState({acApiKey: value});
        this.updateFeedData('acApiKey', value);
    }
    acGqlStoreCodeChangeSetting = (value) => {
        this.setState({acGqlStoreCode: value});
        this.updateFeedData('acGqlStoreCode', value);
    }
    feedTypeOnSelectionChange = (key) => {
        let isFieldTypeValid = validateStateAgainstValue(key, "")
        this.setState({
            isFieldTypeValid: isFieldTypeValid,
            feedTypeKey: key
        });
        this.updateFeedData('feed_type', key);
    }
    scheduleTypeOnSelectionChange = (key) => {
        this.setState({
            scheduleTypeKey: key
        });
        this.updateFeedData('schedule_type', key);
    }
    scheduleDaysOnSelectionChange = (value) => {
        const valueArr = [...value];
        this.setState({scheduleDaysSelectedKeys: valueArr});
        const days = (valueArr.length > 0) ? valueArr.join(',') : '';

        this.updateFeedData('schedule_days', days);
    }
    scheduleTimesOnSelectionChange = (value) => {
        const valueArr = [...value];
        this.setState({scheduleTimesSelectedKeys: valueArr});
        const times = (valueArr.length > 0) ? valueArr.join(',') : '';
        this.updateFeedData('schedule_times', times);
    }
    storeCodeOnSelectionChange = (key) => {
        let isFieldStoreValid = validateStateAgainstValue(key, "")
        this.setState({
            isFieldStoreValid: isFieldStoreValid,
            storeCodeKey: key

        });
        this.updateFeedData('store_code', key);
    }
    uuidChange = (value) => {
        this.setState({uuid: value});
        this.updateFeedData('uuid', value);
    }

    deleteFeedFromDialog = () => {
        console.log('feed delete from action');
        this.deleteFeedByUuid(this.props.feedUuid);
    }
    regenerateFeedHandle = () => {
        console.log('feed regenerate from action');
        this.regenerateFeedByUuid(this.props.feedUuid);
    }

    //feed state
    handleSave = () => {


        this.setState({saveButtonDisabled: true})
        const preCallTime = Date.now()
        const headers = this.getHeaders()
        const params = {}

        params.uuid = (this.props.feedUuid !== undefined
            && this.props.feedUuid !== null
            && this.props.feedUuid !== ''
            && this.props.feedUuid !== 'undefined'
            && typeof this.props.feedUuid !== 'undefined') ? this.props.feedUuid : '';

        /**
         * Validate form before sudmission
         */
        const validationInformation = validateFeedForm(this.state.feedData)
        const validationResult = validationInformation[0]
        const validationErrors = validationInformation[1]
        console.log("Form Validation Results:")
        console.log(validationResult)
        console.log("Form Validation Errors:")
        console.log(validationErrors)
        if (Object.keys(validationResult).length > 0) {
            this.setState(validationResult)
            this.setState({saveButtonDisabled: false})
            ToastQueue.negative("Please check all required fields.", {timeout: 5000});
            return;
        }
        if (Object.keys(validationErrors).length > 0) {
            for (let i = 0; i < Object.keys(validationErrors).length; i++) {
                ToastQueue.negative(validationErrors[i], {timeout: 5000});
            }
            this.setState({saveButtonDisabled: false})
            return;
        }
        /**
         * End Form Validation
         */


        params.feed = this.state.feedData;
        const actionResponse = invokeAction('feed-generator/saveFeed', headers, params, this.props)
            .then(response => {
                ToastQueue.positive('Feed successfully saved', {timeout: 5000});
            }).catch(err => {
                ToastQueue.negative("Cannot save feed.", {timeout: 5000});
            }).finally(() => {
                //nothing to do
                this.setState({saveButtonDisabled: false})
            });

    }

    handleCancel() {
        const {setDialog} = this.props;
        setDialog(null);
        this.reloadFeedTable();
    }

    reloadFeedTable() {
        const {reloadFeedsTable} = this.props;
        reloadFeedsTable();
    }

    updateFeedData(fieldName, value) {
        this.setState(prevState => ({feedData: {...prevState.feedData, [fieldName]: value}}));
    }


    render() {
        if (this.props.isOpen) {
            if (this.state.loading) {
                return (
                    <>
                        <DialogContainer
                            type="modal"
                            isDismissable
                            onDismiss={this.handleCancel}
                        >
                            <Dialog>
                                <Content>
                                    <View>
                                        <ProgressBar width="100%" label="Loading…" isIndeterminate/>
                                    </View>
                                </Content>
                            </Dialog>
                        </DialogContainer>
                    </>
                )
            }

            const {
                feedName,
                searchQuery,
                feedHeader,
                feedBody,
                feedFooter,
                storeCodeKey,
                filterQuery,
                feedTypeKey,
                scheduleTypeKey,
                scheduleTimesOptions,
                scheduleDaysSelectedKeys,
                scheduleTimesSelectedKeys,
                feedTypeOptions,
                storeListOptions,
                autocompleteList,
                isFieldNameValid,
                isFieldTypeValid,
                isFieldStoreValid,
            } = this.state;

            const columns = [
                {name: 'NAME/UUID', uid: 'name'},
                {name: 'STORE', uid: 'store_code', width: 100},
                {name: 'FILE', uid: 'file_path', width: 100},
                {name: 'CREATED', uid: 'created_at', width: 200},
                {name: 'GENERATED', uid: 'generated_at', width: 200,},
                {name: 'TYPE', uid: 'feed_type', width: 50},
                {name: 'GENERATE FEED', uid: 'schedule_type', width: 200},
                {name: 'STATUS', uid: 'status', width: 200}
            ];

            const renderCell = (item, fieldName) => {
                if (fieldName === 'name') {
                    return <Cell>
                        <View>{item['id']}</View>
                    </Cell>
                } else if (fieldName === 'store_code') {
                    const storeCode = item['store_code'] || '';
                    const storeParts = storeCode.split('||');
                    const displayStore = storeParts.reverse().join(' -> ');
                    
                    return <Cell>
                        <View>{displayStore}</View>
                    </Cell>
                } else if (fieldName === 'created_at' || fieldName === 'generated_at') {
                    let value = item[fieldName];
                    if (value !== "") {
                        value = moment(value).format('HH:mm:ss DD.MM.YYYY');
                    }
                    return <Cell>
                        <View>{value}</View>
                    </Cell>
                } else if (fieldName === 'schedule_type') {
                    let value = item[fieldName];
                    let label = "Manually"
                    if (value == "events") {
                        label = "By events from Adobe Commerce"
                    }
                    if (value == "schedule") {
                        label = "By Schedule"
                    }
                    return <Cell>
                        <View>{label}</View>
                    </Cell>
                } else if (fieldName === 'status') {
                    let status = item['status']
                    let variantTxt = "neutral"
                    let label = "Undefined"
                    if (status == "error") {
                        variantTxt = "negative"
                        label = "Error"
                    }
                    if (status == "generated") {
                        variantTxt = "positive"
                        label = "Generated"
                    }
                    if (status == "pending") {
                        variantTxt = "neutral"
                        label = "Pending"
                    }
                    if (status == "in progress") {
                        variantTxt = "yellow"
                        label = "In Progress"
                    }
                    return <Cell>
                        <div className="cell status">
                            <View><StatusLight variant={variantTxt}>{label}</StatusLight></View>
                        </div>
                    </Cell>
                } else if (fieldName === 'file_path') {
                    let errorMsg = item['error']
                    let link = item[fieldName];
                    if (errorMsg !== "" && errorMsg !== undefined) {
                        return <Cell><TooltipTrigger delay='10'>
                            <ActionButton isQuiet aria-label="Show Errors"><InfoOutline/></ActionButton>
                            <Tooltip variant='negative' showIcon='true' width='550px'>
                                <div style={{width: '500px'}}>{errorMsg}</div>
                            </Tooltip>
                        </TooltipTrigger></Cell>
                    }
                    if (link !== "" && typeof link !== 'undefined') {
                        return <Cell>
                            <View><Link><a href={link} target="_blank" download>Download</a></Link></View>
                        </Cell>
                    }
                    return <Cell></Cell>
                } else {
                    return <Cell>
                        {item[fieldName]}
                    </Cell>
                }
            };

            return (
                <>
                    <DialogContainer
                        type="fullscreenTakeover"
                        onDismiss={this.handleCancel}
                    >
                        <Dialog data-section="dialog-add-feed">
                            
                            {this.state.isNewFeed
                                &&
                                <Heading>New Feed</Heading>
                            }

                            {!this.state.isNewFeed &&
                                <Heading>{feedName}</Heading>
                            }
                            {!this.state.isNewFeed &&
                                <ButtonGroup>
                                    <Flex height="100%" gridArea="buttonGroup" direction="row" alignItems="center"
                                          gap='size-250'>
                                        <DialogTrigger>
                                            <ActionButton><Delete/> <Text>Delete Feed</Text></ActionButton>
                                            <AlertDialog
                                                variant="destructive"
                                                title="Delete"
                                                primaryActionLabel="Delete"
                                                onPrimaryAction={this.deleteFeedFromDialog}
                                                cancelLabel="Cancel"
                                            >
                                                Are you sure you want to delete feed <b>{feedName}</b>?
                                            </AlertDialog>
                                        </DialogTrigger>

                                        <ActionButton onPress={this.regenerateFeedHandle}>
                                            <Refresh/> <Text>Regenerate Feed</Text>
                                        </ActionButton>
                                    </Flex>
                                </ButtonGroup>
                            }

                            <Divider/>
                            <Content>
                                {!this.state.isNewFeed &&
                                    <View marginBottom="30px">
                                        <TableView UNSAFE_className="info-table" className="info-table" isQuiet
                                                   aria-label="Feed Information"
                                                   density="spacious">
                                            <TableHeader columns={columns}>
                                                {column => (
                                                    <Column
                                                        key={column.uid}
                                                        width={column.width}
                                                        align='start'>
                                                        <View><span
                                                            className="heading-title">{column.name}</span></View>
                                                    </Column>
                                                )}
                                            </TableHeader>
                                            <TableBody items={this.state.feedInformation}>
                                                {item => (
                                                    <Row>
                                                        {(columnKey) => renderCell(item, columnKey)}
                                                    </Row>
                                                )}
                                            </TableBody>
                                        </TableView>
                                    </View>
                                }

                                <View maxWidth="100%" width="100%">
                                    <Tabs orientation='vertical' isEmphasized isQuiet marginEnd='size-1000'>
                                        <View gridArea="content" width="100%" maxWidth='size-3000'>
                                            <TabList>
                                                <Item key="general">General</Item>
                                                <Item key="filtering">Products Filtering</Item>
                                                <Item key="schedule">Schedule</Item>
                                            </TabList>
                                        </View>
                                        <View gridArea="content" width="100%">
                                            <TabPanels>
                                                <Item key="general">
                                                    <View width="100%" maxWidth="{800}">
                                                        <Form
                                                            labelPosition="top"
                                                            isRequired
                                                        >

                                                            <View width="100%">
                                                                <TextField
                                                                    width="100%"
                                                                    value={feedName}
                                                                    autoFocus
                                                                    label="Feed Name"
                                                                    isRequired
                                                                    validationState={isFieldNameValid}
                                                                    onChange={this.feedNameChange}/>
                                                            </View>

                                                            <View width="100%">
                                                                <Picker
                                                                    width="100%"
                                                                    label="Feed type"
                                                                    items={feedTypeOptions}
                                                                    selectedKey={feedTypeKey}
                                                                    onSelectionChange={this.feedTypeOnSelectionChange}
                                                                    validationState={isFieldTypeValid}
                                                                >
                                                                    {item => <Item key={item.id}>{item.title}</Item>}
                                                                </Picker>
                                                            </View>

                                                            <View width="100%">
                                                                <Picker
                                                                    width="100%"
                                                                    label="Adobe Commerce Store"
                                                                    items={storeListOptions}
                                                                    selectedKey={storeCodeKey}
                                                                    onSelectionChange={this.storeCodeOnSelectionChange}
                                                                    validationState={isFieldStoreValid}
                                                                >
                                                                    {item => (
                                                                        <Section key={item.name} items={item.children}
                                                                                 title={item.name}>
                                                                            {item => <Item
                                                                                key={item.code}>{item.name}</Item>}
                                                                        </Section>
                                                                    )}
                                                                </Picker>
                                                            </View>

                                                            <View direction='column'>
                                                                <View>
                                                                    <div className="spectrum-Form-itemLabel">Feed Header
                                                                    </div>
                                                                </View>
                                                                <View width="{800}" height="size-3600"
                                                                      marginEnd="size-300">
                                                                    <div className="CodeEditorWrapper">
                                                                        <CodeEditor code={feedHeader}
                                                                                    onCodeChange={this.feedHeaderChange}
                                                                                    isRequired={false}
                                                                                    mode={feedTypeKey}
                                                                                    lineNumbers={false}
                                                                                    autocompleteCustomList={[]}
                                                                        />
                                                                    </div>
                                                                </View>
                                                            </View>

                                                            <View direction='column'>
                                                                <View>
                                                                    <div className="spectrum-Form-itemLabel">Feed Item
                                                                        Body
                                                                    </div>
                                                                </View>
                                                                <View width="{800}" height="size-3600"
                                                                      marginEnd="size-300">
                                                                    <div className="CodeEditorWrapper">
                                                                        <CodeEditor code={feedBody}
                                                                                    onCodeChange={this.feedBodyChange}
                                                                                    mode={feedTypeKey}
                                                                                    autocompleteCustomList={autocompleteList}
                                                                        />
                                                                    </div>
                                                                </View>
                                                            </View>

                                                            <View direction='column'>
                                                                <View>
                                                                    <div className="spectrum-Form-itemLabel">Feed Footer
                                                                    </div>
                                                                </View>
                                                                <View width="{800}" height="size-3600"
                                                                      marginEnd="size-300">
                                                                    <div className="CodeEditorWrapper">
                                                                        <CodeEditor code={feedFooter}
                                                                                    onCodeChange={this.feedFooterChange}
                                                                                    mode={feedTypeKey}
                                                                                    isRequired={false}
                                                                                    autocompleteCustomList={[]}
                                                                        />
                                                                    </div>
                                                                </View>
                                                            </View>
                                                        </Form>
                                                    </View>
                                                </Item>
                                                <Item key="filtering">
                                                    <View width="100%" maxWidth="{800}">
                                                        <Form
                                                            labelPosition="top"
                                                            isRequired
                                                        >
                                                            <View width="100%">
                                                                <View width="100%">
                                                                    <TextField
                                                                        width="100%"
                                                                        value={searchQuery}
                                                                        autoFocus
                                                                        label="Search Query"
                                                                        onChange={this.feedSearchQueryChange}/>
                                                                </View>
                                                                <View direction='column'>
                                                                    <View>
                                                                        <div className="spectrum-Form-itemLabel">Filter
                                                                            Configuration (JSON)
                                                                        </div>
                                                                    </View>
                                                                    <View width="{800}" height="size-3600"
                                                                          marginEnd="size-300">
                                                                        <div className="CodeEditorWrapper">
                                                                            <CodeEditor code={filterQuery}
                                                                                        onCodeChange={this.feedFilterQueryChange}
                                                                                        mode="JSON"
                                                                                        isRequired={false}
                                                                                        autocompleteCustomList={[]}
                                                                            />
                                                                        </div>
                                                                    </View>
                                                                </View>
                                                            </View>
                                                        </Form>
                                                    </View>
                                                </Item>
                                                <Item key="schedule">
                                                    <View width="100%" maxWidth="size-6000">
                                                        <Form
                                                            labelPosition="top"
                                                        >

                                                            <View width="100%">
                                                                <Picker
                                                                    width="100%"
                                                                    label="Generate Feed"
                                                                    selectedKey={scheduleTypeKey}
                                                                    onSelectionChange={this.scheduleTypeOnSelectionChange}
                                                                >
                                                                    {/*<Item key="events">By events from Adobe Commerce</Item>*/}
                                                                    <Item key="schedule">By Schedule</Item>
                                                                    <Item key="manually">Manually</Item>
                                                                </Picker>

                                                                {scheduleTypeKey == 'schedule' &&

                                                                    <Flex marginTop="size-500" direction="row"
                                                                          gap="size-500" maxHeight="300px">

                                                                        <ListView
                                                                            aria-label="Days"
                                                                            selectionMode='multiple'
                                                                            maxWidth="size-3000"
                                                                            width="50%"
                                                                            items={FeedForm.scheduleDaysOptions}
                                                                            selectedKeys={scheduleDaysSelectedKeys}
                                                                            onSelectionChange={this.scheduleDaysOnSelectionChange}
                                                                        >
                                                                            {(item) => <Item
                                                                                key={item.key}>{item.name}</Item>}
                                                                        </ListView>
                                                                        <ListView
                                                                            aria-label="Times"
                                                                            selectionMode='multiple'
                                                                            maxWidth="size-3000"
                                                                            width="40%"
                                                                            items={scheduleTimesOptions}
                                                                            selectedKeys={scheduleTimesSelectedKeys}
                                                                            onSelectionChange={this.scheduleTimesOnSelectionChange}
                                                                        >
                                                                            {(item) => <Item
                                                                                key={item.name}>{item.name}</Item>}
                                                                        </ListView>
                                                                    </Flex>
                                                                }
                                                            </View>
                                                        </Form>
                                                    </View>
                                                </Item>
                                            </TabPanels>
                                        </View>
                                    </Tabs>

                                    <Flex direction="column" alignItems="center" marginStart='size-3000'
                                          maxWidth="size-6000">
                                        <View padding='size-100' marginTop='size-500'>
                                            <ButtonGroup data-section="actions">
                                                <Button variant="secondary" style="outline"
                                                        onPress={this.handleCancel}>Close</Button>
                                                <Button variant="accent" onPress={this.handleSave}
                                                        isDisabled={this.state.saveButtonDisabled}>Save</Button>
                                            </ButtonGroup>
                                        </View>
                                    </Flex>
                                </View>
                            </Content>

                        </Dialog>
                    </DialogContainer>
                </>
            );
        }
    }
}

export default FeedForm;