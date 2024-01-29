pipeline {
    parameters {
        // SCAN Variables
        string(name: 'SCANOSS_API_TOKEN_ID', defaultValue:"scanoss-token", description: 'The reference ID for the SCANOSS API TOKEN credential')
        
        string(name: 'SCANOSS_SBOM_IDENTIFY', defaultValue:"sbom.json", description: 'SCANOSS SBOM Identify filename')
        
        string(name: 'SCANOSS_SBOM_IGNORE', defaultValue:"sbom-ignore.json", description: 'SCANOSS SBOM Ignore filename')
        
        // JIRA Variables
        string(name: 'JIRA_URL', defaultValue:"" , description: 'Jira URL')
        
        string(name: 'JIRA_PROJECT_KEY', defaultValue:"TESTPROJ" , description: 'Jira Project Key')
        
        // Policy Check Script
        text(name: 'POLICY_SCRIPT', defaultValue: '', description: 'Enter Policy Evaluation Script')
                
        booleanParam(name: 'CREATE_JIRA_ISSUE', defaultValue: false, description: 'Enable Jira reporting')
        
        
    }
    agent any
      stages {
        stage('Git Checkout') {
            steps {
                script {
                    git branch: 'main',
                        credentialsId: 'gh-token',
                        url: 'https://github.com/scanoss/integration-test'
                        
                }
            }
        }
        stage('Scan') {
            agent {
                docker {
                    image 'ghcr.io/scanoss/scanoss-py:v1.9.0'
                    args '--entrypoint='
                    // Run the container on the node specified at the
                    // top-level of the Pipeline, in the same workspace,
                    // rather than on a new node entirely:
                    reuseNode true
                }
            }
            steps {


                  withCredentials([string(credentialsId: params.SCANOSS_API_TOKEN_ID , variable: 'SCANOSS_API_TOKEN')]) {
                                      script {

                                          sh '''

                                            SBOM_IDENTIFY=""
                                            if [ -f $SCANOSS_SBOM_IDENTIFY ]; then SBOM_IDENTIFY="--identify $SCANOSS_SBOM_IDENTIFY" ; fi

                                            SBOM_IGNORE=""
                                            if [ -f $SCANOSS_SBOM_IGNORE ]; then SBOM_IGNORE="--ignore $SCANOSS_SBOM_IGNORE" ; fi


                                            CUSTOM_URL=""
                                            if [ ! -z $SCANOSS_API_URL ]; then CUSTOM_URL="--apiurl $SCANOSS_API_URL"; else CUSTOM_URL="--apiurl https://osskb.org/api/scan/direct" ; fi

                                            CUSTOM_TOKEN=""
                                            if [ ! -z $SCANOSS_API_TOKEN ]; then CUSTOM_TOKEN="--key $SCANOSS_API_TOKEN" ; fi


                                            scanoss-py scan $CUSTOM_URL $CUSTOM_TOKEN $SBOM_IDENTIFY $SBOM_IGNORE --output scan_results.json .
                                            '''
                                      }
                                  }
        }
        stage('Process scan results') {
            agent {
                docker {
                     image 'node:20.11.0-alpine3.19' 
                     reuseNode true
                }
            }
            steps {
                script {
                try{
                   sh 'echo $POLICY_SCRIPT > index.js'
                   sh 'node index.js'
                   sh 'if [ $? -eq "0"  ] ; then echo "SUCCESS" ; else echo "FAILURE"; fi'
                   currentBuild.result = 'SUCCESS'
                }catch(e){
                     echo e.getMessage()
                     //currentBuild.result = 'FAILURE'
                }
                }
              
            }
        }
        stage('Publish CSV Reports') {
            steps {
                publishReport name: "Scan Results", displayType: "dual", provider: csv(id: "csv-ten", pattern: "data.csv")
            }
        }
        stage('Jira Issue'){
            when {
                expression { params.CREATE_JIRA_ISSUE == true }
            }
            steps {
              withCredentials([usernamePassword(credentialsId: 'jira-token',usernameVariable: 'USERNAME', passwordVariable: 'PASSWORD')]) {
                    script {
                       
                    
                        def copyLeft = sh(script: "tail -n +2 data.csv | cut -d',' -f1", returnStdout: true)
                        
                            
                        def JSON_PAYLOAD =  [
                             fields : [
                                project : [
                                    key: params.JIRA_PROJECT_KEY
                                ],
                                summary : 'Copyleft licenses detected',
                                description: copyLeft,
                                issuetype: [
                                    name: 'Bug'
                                ]
                            ]
                        ]
    
                        def jsonString = groovy.json.JsonOutput.toJson(JSON_PAYLOAD)
                        
                            
                        createJiraIssue(PASSWORD, USERNAME, params.JIRA_URL, jsonString)
                    }
              }
              
           }
        }
    }    
        
}    

def createJiraIssue(jiraToken, jiraUsername, jiraAPIEndpoint, payload) {
    env.TOKEN = jiraToken
    env.USER = jiraUsername
    env.JIRA_ENDPOINT_URL = jiraAPIEndpoint + '/rest/api/2/issue/'
    
    echo env.URL


    env.PAYLOAD = payload

    try {
        def command = """
            curl -vvv -u '${USER}:${TOKEN}' -X POST --data '${PAYLOAD}' -H 'Content-Type: application/json' '${JIRA_ENDPOINT_URL}' 
        """
        echo command

        def response = sh(script: command, returnStdout: true).trim()
        echo "Response: ${response}"
 
    } catch (Exception e) {
        echo e
    }
}
