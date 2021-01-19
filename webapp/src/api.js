import axios from 'axios';

class APIClient {

    constructor(host){
        this.host = new URL(host);
    }

    static get Methods(){
        return { 
            'GET': 'GET', 
            'POST': 'POST', 
            'PUT': 'PUT', 
            'DELETE': 'DELETE' 
        }
    }

    static clientFactory(){
        return new APIClient(process.env.REACT_APP_API_HOST);
    }

    request(endpoint, params, method){

        const url = new URL(endpoint,this.host);
        const { searchParams } = url;

        let options;
        
        method = method || APIClient.Methods.GET;

        options = {
            method,
            headers: {
                Authorization: `Bearer ${localStorage.getItem('idToken')}`
            }
        };

        if(method === APIClient.Methods.GET && params){
            Object.entries(params).forEach(([key,value])=>{
                searchParams.append(key, value);
            })
        }
        else if([APIClient.Methods.PUT,APIClient.Methods.POST].includes(method)){
            options.data = params;
        }

        options.url = url.toString();
        
        return axios(options);
    }

    get = async (endpoint, params) => {
        return (await this.request(endpoint, params)).data;
    }

    delete = async (endpoint, params) => {
        return (await this.request(endpoint, params, APIClient.Methods.DELETE)).data
    }

    put = async (endpoint, params) => {
        return (await (this.request(endpoint, params, APIClient.Methods.PUT))).data;
    }

    post = async (endpoint, params) => {
        return (await this.request(endpoint, params, APIClient.Methods.POST)).data;
    }

    identifyFace = async(snapshot)=>{
        return this.post('/face', {
            snapshot
        })
    }
    
}

export default APIClient.clientFactory();