document.addEventListener('DOMContentLoaded', function() {
    // Global variables
    let assessmentData = {
        studentName: "",
        startTime: null,
        endTime: null,
        activities: {
            whsMeeting: {
                completed: false,
                data: {}
            },
            hazardIdentification: {
                completed: false,
                data: {
                    inspections: {},
                    riskAssessments: []
                }
            },
            emergencyResponse: {
                completed: false,
                data: {}
            },
            staffSupervision: {
                completed: false,
                data: {}
            }
        }
    };
    
    let currentSection = "welcome-screen";
    let timerInterval;
    let timeRemaining = 7200; // 2 hours in seconds
    
    // Hazard data
    const hazardData = {
        chemical: [
            { id: "chem1", description: "Unlabeled chemical containers" },
            { id: "chem2", description: "Chemical storage cabinet not locked" },
            { id: "chem3", description: "Spill kit missing essential items" },
            { id: "chem4", description: "Incompatible chemicals stored together" }
        ],
        equipment: [
            { id: "equip1", description: "Tractor maintenance overdue" },
            { id: "equip2", description: "Damaged electrical cords on power tools" },
            { id: "equip3", description: "Missing machine guards on equipment" },
            { id: "equip4", description: "Improper storage of fuel containers" }
        ],
        field: [
            { id: "field1", description: "Workers not using required PPE" },
            { id: "field2", description: "Uneven terrain creating trip hazards" },
            { id: "field3", description: "Inadequate shade for rest breaks" },
            { id: "field4", description: "Poor access to drinking water" }
        ],
        livestock: [
            { id: "live1", description: "Broken gate in animal enclosure" },
            { id: "live2", description: "Slippery surfaces in animal handling area" },
            { id: "live3", description: "Inadequate lighting in livestock barn" },
            { id: "live4", description: "Feed storage area attracting vermin" }
        ]
    };
    
    // Team feedback responses
    const teamFeedback = {
        chemical: {
            directive: "The team seems hesitant about your approach. They follow your instructions but don't seem engaged in the solution.",
            collaborative: "The team responds positively to being involved in the solution. Sarah suggests implementing a chemical inventory system, and Miguel offers to create proper labels for all containers.",
            delegative: "The team member you assigned seems overwhelmed by the responsibility. Others appear relieved they weren't chosen.",
            educational: "The team appreciates the training opportunity. They ask good questions and seem to better understand the importance of proper chemical handling."
        },
        equipment: {
            directive: "The team follows your instructions but Sarah mentions that there might be additional issues with the equipment that aren't being addressed.",
            collaborative: "The team engages enthusiastically. Sarah shares her expertise about the tractor issues and John suggests a regular maintenance schedule.",
            delegative: "The assigned team member accepts the responsibility but seems unsure about how to proceed without more guidance.",
            educational: "The team shows interest in learning more about equipment maintenance. They ask practical questions about identifying potential issues early."
        },
        ppe: {
            directive: "The team nods in agreement but doesn't seem convinced about the importance of consistent PPE use.",
            collaborative: "The discussion reveals that some PPE is uncomfortable or difficult to use. The team suggests trying different brands or styles.",
            delegative: "The assigned team member seems uncomfortable being put in a position to monitor their peers' PPE compliance.",
            educational: "The team responds well to learning about the specific risks that PPE protects against. They seem more motivated to use it consistently."
        },
        firstaid: {
            directive: "The team acknowledges your instructions but doesn't offer any input about other emergency preparedness issues.",
            collaborative: "The team actively participates and identifies additional emergency response gaps. Aisha volunteers to check first aid kits weekly.",
            delegative: "The assigned team member accepts the task but mentions they don't have first aid training.",
            educational: "The team shows interest in emergency procedures. Several members ask about getting first aid certification."
        }
    };
    
    // Emergency response feedback
    const emergencyFeedback = {
        correct: [2, 3, 5, 6], // Correct response IDs
        feedback: {
            good: "Your response was appropriate and prioritized Miguel's safety. Getting him to the emergency shower/eyewash station immediately is critical for chemical exposure. Finding the SDS will provide important information about the chemical and required treatment. Calling Triple Zero (000) is necessary given the severity of the situation, and cordoning off the area prevents others from being exposed.",
            partial: "Your response addressed some key aspects of the emergency, but missed some critical steps. In chemical exposure situations, immediate decontamination is essential, as is getting proper medical attention. Always consult the SDS for specific chemical response procedures.",
            poor: "Your response missed critical safety protocols for chemical exposure. In this situation, immediate decontamination at the emergency shower/eyewash station is the top priority, followed by seeking medical attention. The spill should not be cleaned until proper information (from the SDS) and equipment is available."
        }
    };
    
    // DOM elements
    const startBtn = document.getElementById('start-btn');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const progressBar = document.getElementById('progress-bar');
    const currentActivity = document.getElementById('current-activity');
    const timer = document.getElementById('timer');
    const timeDisplay = document.getElementById('time-display');
    
    // Activity-specific buttons
    const introBtn = document.getElementById('intro-continue-btn');
    const whsBtn = document.getElementById('whs-complete-btn');
    const hazardBtn = document.getElementById('hazard-complete-btn');
    const emergencyBtn = document.getElementById('emergency-complete-btn');
    const supervisionBtn = document.getElementById('supervision-complete-btn');
    const downloadBtn = document.getElementById('download-results');
    
    // Navigation order
    const sections = [
        "introduction",
        "whs-meeting",
        "hazard-identification",
        "emergency-response",
        "staff-supervision",
        "assessment-complete"
    ];
    
    // Start assessment
    startBtn.addEventListener('click', function() {
        document.getElementById('welcome-screen').classList.add('hidden');
        document.getElementById('assessment-container').classList.remove('hidden');
        document.getElementById('introduction').classList.remove('hidden');
        currentSection = "introduction";
        updateProgress();
        startTimer();
        
        // Record start time
        assessmentData.startTime = new Date().toISOString();
    });
    
    // Navigation buttons
    prevBtn.addEventListener('click', function() {
        navigateToPrevious();
    });
    
    nextBtn.addEventListener('click', function() {
        navigateToNext();
    });
    
    // Section completion buttons
    introBtn.addEventListener('click', function() {
        navigateToNext();
    });
    
    whsBtn.addEventListener('click', function() {
        // Save WHS Meeting data
        saveWhsMeetingData();
        assessmentData.activities.whsMeeting.completed = true;
        navigateToNext();
    });
    
    hazardBtn.addEventListener('click', function() {
        // Save Hazard Identification data
        assessmentData.activities.hazardIdentification.completed = true;
        navigateToNext();
    });
    
    // Emergency response buttons
    document.getElementById('respond-btn').addEventListener('click', function() {
        handleEmergencyResponse();
    });
    
    document.getElementById('submit-incident-report').addEventListener('click', function() {
        saveIncidentReport();
        document.getElementById('emergency-complete-btn').classList.remove('hidden');
    });
    
    emergencyBtn.addEventListener('click', function() {
        assessmentData.activities.emergencyResponse.completed = true;
        navigateToNext();
    });
    
    supervisionBtn.addEventListener('click', function() {
        // Save Staff Supervision data
        saveStaffSupervisionData();
        assessmentData.activities.staffSupervision.completed = true;
        navigateToNext();
        
        // Record end time
        assessmentData.endTime = new Date().toISOString();
        clearInterval(timerInterval);
    });
    
    downloadBtn.addEventListener('click', function() {
        downloadResults();
    });
    
    // WHS Meeting event listeners
    document.querySelectorAll('#chemical-approach, #equipment-approach, #ppe-approach, #firstaid-approach').forEach(select => {
        select.addEventListener('change', function() {
            const area = this.id.split('-')[0];
            const approach = this.value;
            const responseDiv = document.getElementById(`${area}-response`);
            
            if (approach) {
                responseDiv.classList.remove('hidden');
                
                // Set appropriate feedback based on area and approach
                let feedbackText = "";
                if (area === 'chemical') {
                    feedbackText = teamFeedback.chemical[approach];
                } else if (area === 'equipment') {
                    feedbackText = teamFeedback.equipment[approach];
                } else if (area === 'ppe') {
                    feedbackText = teamFeedback.ppe[approach];
                } else if (area === 'firstaid') {
                    feedbackText = teamFeedback.firstaid[approach];
                }
                
                responseDiv.querySelector('.team-feedback').textContent = feedbackText;
            } else {
                responseDiv.classList.add('hidden');
            }
        });
    });
    
    // Hazard Identification event listeners
    document.querySelectorAll('.inspection-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const area = this.id.split('-')[1]; // chemical, equipment, field, livestock
            showInspectionResults(area);
        });
    });
    
    document.getElementById('hazard-select').addEventListener('change', function() {
        const hazardId = this.value;
        if (hazardId) {
            showRiskAssessmentForm(hazardId);
        } else {
            document.getElementById('risk-assessment-form').classList.add('hidden');
        }
    });
    
    document.getElementById('likelihood').addEventListener('change', updateRiskRating);
    document.getElementById('consequence').addEventListener('change', updateRiskRating);
    
    document.getElementById('save-assessment').addEventListener('click', saveRiskAssessment);
    
    // Emergency Response event listeners
    document.querySelectorAll('input[name="performance-approach"]').forEach(radio => {
        radio.addEventListener('change', function() {
            if (this.value === 'private') {
                document.getElementById('conversation-simulation').classList.remove('hidden');
            } else {
                document.getElementById('conversation-simulation').classList.add('hidden');
            }
        });
    });
    
    document.querySelectorAll('input[name="response-option"]').forEach(radio => {
        radio.addEventListener('change', function() {
            if (this.checked) {
                document.getElementById('feedback-section').classList.remove('hidden');
            }
        });
    });
    
    // Functions
    function navigateToNext() {
        if (currentSection === "welcome-screen") {
            currentSection = "introduction";
        } else {
            const currentIndex = sections.indexOf(currentSection);
            if (currentIndex < sections.length - 1) {
                currentSection = sections[currentIndex + 1];
            }
        }
        
        updateView();
        updateProgress();
    }
    
    function navigateToPrevious() {
        const currentIndex = sections.indexOf(currentSection);
        if (currentIndex > 0) {
            currentSection = sections[currentIndex - 1];
            updateView();
            updateProgress();
        }
    }
    
    function updateView() {
        // Hide all content sections
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.add('hidden');
        });
        
        // Show current section
        document.getElementById(currentSection).classList.remove('hidden');
        
        // Update buttons
        const currentIndex = sections.indexOf(currentSection);
        prevBtn.disabled = currentIndex === 0;
        
        if (currentIndex === sections.length - 1) {
            nextBtn.classList.add('hidden');
        } else {
            nextBtn.classList.remove('hidden');
        }
        
        // Update current activity label
        let activityLabel = currentSection.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
        currentActivity.textContent = activityLabel;
    }
    
    function updateProgress() {
        const currentIndex = sections.indexOf(currentSection);
        const progressPercentage = (currentIndex / (sections.length - 1)) * 100;
        progressBar.style.width = `${progressPercentage}%`;
    }
    
    function startTimer() {
        timer.classList.remove('hidden');
        updateTimerDisplay();
        
        timerInterval = setInterval(function() {
            timeRemaining--;
            updateTimerDisplay();
            
            if (timeRemaining <= 0) {
                clearInterval(timerInterval);
                alert("Time's up! Your assessment will be submitted with your current progress.");
                // Force navigation to completion
                currentSection = "assessment-complete";
                updateView();
                updateProgress();
            }
        }, 1000);
    }
    
    function updateTimerDisplay() {
        const hours = Math.floor(timeRemaining / 3600);
        const minutes = Math.floor((timeRemaining % 3600) / 60);
        const seconds = timeRemaining % 60;
        
        timeDisplay.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        // Change color when time is running low
        if (timeRemaining < 600) { // Less than 10 minutes
            timeDisplay.classList.add('text-red-600');
        }
    }
    
    // WHS Meeting functions
    function saveWhsMeetingData() {
        const meetingData = {
            objective: document.getElementById('meeting-objective').value,
            agendaItems: getSelectedCheckboxValues('agenda'),
            materials: document.getElementById('meeting-materials').value,
            chemicalHazard: {
                approach: document.getElementById('chemical-approach').value,
                actionItems: document.getElementById('chemical-action').value
            },
            equipmentHazard: {
                approach: document.getElementById('equipment-approach').value,
                actionItems: document.getElementById('equipment-action').value
            },
            ppeHazard: {
                approach: document.getElementById('ppe-approach').value,
                actionItems: document.getElementById('ppe-action').value
            },
            firstaidHazard: {
                approach: document.getElementById('firstaid-approach').value,
                actionItems: document.getElementById('firstaid-action').value
            },
            summary: document.getElementById('meeting-summary').value,
            followup: document.getElementById('meeting-followup').value
        };
        
        assessmentData.activities.whsMeeting.data = meetingData;
    }
    
    function getSelectedCheckboxValues(prefix) {
        const selected = [];
        document.querySelectorAll(`input[id^="${prefix}-"]`).forEach(checkbox => {
            if (checkbox.checked) {
                const id = checkbox.id;
                const value = document.querySelector(`label[for="${id}"]`).textContent;
                selected.push(value);
            }
        });
        return selected;
    }
    
    // Hazard Identification functions
    function showInspectionResults(area) {
        const inspectionResults = document.getElementById('inspection-results');
        const inspectionArea = document.getElementById('inspection-area');
        const hazardsFound = document.getElementById('hazards-found');
        
        inspectionResults.classList.remove('hidden');
        inspectionArea.textContent = formatAreaName(area);
        
        // Clear previous hazards
        hazardsFound.innerHTML = '';
        
        // Add hazards for the selected area
        hazardData[area].forEach(hazard => {
            const hazardDiv = document.createElement('div');
            hazardDiv.className = 'p-2 bg-white border border-gray-300 rounded flex items-center';
            hazardDiv.innerHTML = `
                <input type="checkbox" id="${hazard.id}" class="mr-2 identified-hazard" data-area="${area}" data-description="${hazard.description}">
                <label for="${hazard.id}">${hazard.description}</label>
            `;
            hazardsFound.appendChild(hazardDiv);
        });
        
        // Save inspection to assessment data
        if (!assessmentData.activities.hazardIdentification.data.inspections[area]) {
            assessmentData.activities.hazardIdentification.data.inspections[area] = {
                inspected: true,
                timestamp: new Date().toISOString()
            };
        }
        
        // Add event listeners to checkboxes
        document.querySelectorAll('.identified-hazard').forEach(checkbox => {
            checkbox.addEventListener('change', function() {
                updateHazardSelect();
            });
        });
        
        // Update hazard select dropdown
        updateHazardSelect();
    }
    
    function formatAreaName(area) {
        switch(area) {
            case 'chemical': return 'Chemical Storage Area';
            case 'equipment': return 'Equipment Shed';
            case 'field': return 'Field Operations';
            case 'livestock': return 'Livestock Area';
            default: return area;
        }
    }
    
    function updateHazardSelect() {
        const hazardSelect = document.getElementById('hazard-select');
        
        // Clear current options except the first one
        while (hazardSelect.options.length > 1) {
            hazardSelect.remove(1);
        }
        
        // Add identified hazards to the select
        document.querySelectorAll('.identified-hazard:checked').forEach(checkbox => {
            const option = document.createElement('option');
            option.value = checkbox.id;
            option.dataset.area = checkbox.dataset.area;
            option.dataset.description = checkbox.dataset.description;
            option.textContent = `${formatAreaName(checkbox.dataset.area)}: ${checkbox.dataset.description}`;
            hazardSelect.appendChild(option);
        });
    }
    
    function showRiskAssessmentForm(hazardId) {
        const form = document.getElementById('risk-assessment-form');
        form.classList.remove('hidden');
        
        // Get the selected option
        const option = document.querySelector(`#hazard-select option[value="${hazardId}"]`);
        const description = option.dataset.description;
        
        // Set the hazard description
        document.getElementById('hazard-description').value = description;
        
        // Reset form fields
        document.getElementById('likelihood').value = '';
        document.getElementById('consequence').value = '';
        document.getElementById('risk-rating').textContent = 'Select likelihood and consequence to calculate';
        document.getElementById('risk-rating').className = 'p-3 font-bold text-center border rounded';
        document.querySelectorAll('.control-measure').forEach(cb => cb.checked = false);
        document.getElementById('control-details').value = '';
        document.getElementById('responsible-person').value = '';
        document.getElementById('completion-date').value = '';
    }
    
    function updateRiskRating() {
        const likelihood = parseInt(document.getElementById('likelihood').value) || 0;
        const consequence = parseInt(document.getElementById('consequence').value) || 0;
        
        if (likelihood > 0 && consequence > 0) {
            const riskScore = likelihood * consequence;
            const ratingElement = document.getElementById('risk-rating');
            
            let ratingText, ratingClass;
            
            if (riskScore >= 15) {
                ratingText = `Extreme Risk (${riskScore})`;
                ratingClass = 'bg-red-100 text-red-800 border-red-300';
            } else if (riskScore >= 10) {
                ratingText = `High Risk (${riskScore})`;
                ratingClass = 'bg-orange-100 text-orange-800 border-orange-300';
            } else if (riskScore >= 5) {
                ratingText = `Medium Risk (${riskScore})`;
                ratingClass = 'bg-yellow-100 text-yellow-800 border-yellow-300';
            } else {
                ratingText = `Low Risk (${riskScore})`;
                ratingClass = 'bg-green-100 text-green-800 border-green-300';
            }
            
            ratingElement.textContent = ratingText;
            ratingElement.className = `p-3 font-bold text-center border rounded ${ratingClass}`;
        }
    }
    
    function saveRiskAssessment() {
        const hazardSelect = document.getElementById('hazard-select');
        const selectedOption = hazardSelect.options[hazardSelect.selectedIndex];
        
        if (!selectedOption.value) {
            alert('Please select a hazard to assess.');
            return;
        }
        
        const likelihood = document.getElementById('likelihood').value;
        const consequence = document.getElementById('consequence').value;
        
        if (!likelihood || !consequence) {
            alert('Please select both likelihood and consequence.');
            return;
        }
        
        const controlMeasures = getSelectedCheckboxValues('control');
        if (controlMeasures.length === 0) {
            alert('Please select at least one control measure.');
            return;
        }
        
        const responsiblePerson = document.getElementById('responsible-person').value;
        const completionDate = document.getElementById('completion-date').value;
        
        if (!responsiblePerson || !completionDate) {
            alert('Please assign a responsible person and completion date.');
            return;
        }
        
        // Create risk assessment object
        const riskAssessment = {
            hazardId: selectedOption.value,
            area: selectedOption.dataset.area,
            description: selectedOption.dataset.description,
            likelihood: likelihood,
            consequence: consequence,
            riskScore: parseInt(likelihood) * parseInt(consequence),
            controlMeasures: controlMeasures,
            controlDetails: document.getElementById('control-details').value,
            responsiblePerson: responsiblePerson,
            completionDate: completionDate,
            timestamp: new Date().toISOString()
        };
        
        // Add to assessment data
        assessmentData.activities.hazardIdentification.data.riskAssessments.push(riskAssessment);
        
        // Update completed assessments display
        updateCompletedAssessments(riskAssessment);
        
        // Reset form
        document.getElementById('hazard-select').value = '';
        document.getElementById('risk-assessment-form').classList.add('hidden');
        
        // Update hazard select (remove the assessed hazard)
        const option = document.querySelector(`#hazard-select option[value="${riskAssessment.hazardId}"]`);
        if (option) {
            option.remove();
        }
        
        // Uncheck the corresponding hazard checkbox
        const checkbox = document.getElementById(riskAssessment.hazardId);
        if (checkbox) {
            checkbox.checked = false;
        }
    }
    
    function updateCompletedAssessments(assessment) {
        const completedDiv = document.getElementById('completed-assessments');
        
        // Remove placeholder text if present
        if (completedDiv.querySelector('.italic')) {
            completedDiv.innerHTML = '';
        }
        
        // Create assessment summary element
        const assessmentDiv = document.createElement('div');
        assessmentDiv.className = 'p-3 bg-gray-50 border border-gray-300 rounded mb-2';
        
        let riskClass;
        if (assessment.riskScore >= 15) {
            riskClass = 'bg-red-100 text-red-800 border-red-300';
        } else if (assessment.riskScore >= 10) {
            riskClass = 'bg-orange-100 text-orange-800 border-orange-300';
        } else if (assessment.riskScore >= 5) {
            riskClass = 'bg-yellow-100 text-yellow-800 border-yellow-300';
        } else {
            riskClass = 'bg-green-100 text-green-800 border-green-300';
        }
        
        assessmentDiv.innerHTML = `
            <div class="flex justify-between items-center mb-2">
                <span class="font-bold">${formatAreaName(assessment.area)}</span>
                <span class="px-2 py-1 rounded text-sm ${riskClass}">Risk: ${assessment.riskScore}</span>
            </div>
            <p class="text-sm mb-1">${assessment.description}</p>
            <p class="text-sm text-gray-600">Assigned to: ${assessment.responsiblePerson} | Due: ${assessment.completionDate}</p>
        `;
        
        completedDiv.appendChild(assessmentDiv);
    }
    
    // Emergency Response functions
    function handleEmergencyResponse() {
        const selectedResponses = [];
        document.querySelectorAll('.response-action:checked').forEach(checkbox => {
            selectedResponses.push(parseInt(checkbox.id.split('-')[1]));
        });
        
        // Check if responses are correct
        const correctResponses = emergencyFeedback.correct;
        const correctCount = selectedResponses.filter(r => correctResponses.includes(r)).length;
        const incorrectCount = selectedResponses.filter(r => !correctResponses.includes(r)).length;
        
        let feedbackText;
        if (correctCount === correctResponses.length && incorrectCount === 0) {
            feedbackText = emergencyFeedback.feedback.good;
        } else if (correctCount >= 2) {
            feedbackText = emergencyFeedback.feedback.partial;
        } else {
            feedbackText = emergencyFeedback.feedback.poor;
        }
        
        // Show feedback
        const feedbackDiv = document.getElementById('emergency-feedback');
        const feedbackContent = document.getElementById('response-feedback-content');
        
        feedbackDiv.classList.remove('hidden');
        feedbackContent.innerHTML = `
            <div class="p-3 rounded ${correctCount === correctResponses.length && incorrectCount === 0 ? 'bg-green-100' : 'bg-yellow-100'}">
                <p class="mb-2">${feedbackText}</p>
            </div>
        `;
        
        // Show follow-up actions
        document.getElementById('followup-actions').classList.remove('hidden');
        
        // Show incident documentation
        document.getElementById('incident-documentation').classList.remove('hidden');
        
        // Save emergency response data
        assessmentData.activities.emergencyResponse.data.immediateResponse = {
            selectedActions: selectedResponses,
            additionalInstructions: document.getElementById('additional-instructions').value,
            correctCount: correctCount,
            incorrectCount: incorrectCount
        };
        
        // Disable response button
        document.getElementById('respond-btn').disabled = true;
        document.getElementById('respond-btn').classList.add('opacity-50');
    }
    
    function saveIncidentReport() {
        const followupActions = [];
        document.querySelectorAll('.followup-action:checked').forEach(checkbox => {
            followupActions.push(parseInt(checkbox.id.split('-')[1]));
        });
        
        const incidentReport = {
            date: document.getElementById('incident-date').value,
            location: document.getElementById('incident-location').value,
            description: document.getElementById('incident-description').value,
            personsInvolved: document.getElementById('persons-involved').value,
            injuryDescription: document.getElementById('injury-description').value,
            actionsTaken: document.getElementById('actions-taken').value,
            rootCause: document.getElementById('root-cause').value,
            preventiveMeasures: document.getElementById('preventive-measures').value
        };
        
        // Save to assessment data
        assessmentData.activities.emergencyResponse.data.followupActions = followupActions;
        assessmentData.activities.emergencyResponse.data.incidentReport = incidentReport;
        
        // Disable submit button
        document.getElementById('submit-incident-report').disabled = true;
        document.getElementById('submit-incident-report').classList.add('opacity-50');
    }
    
    // Staff Supervision functions
    function saveStaffSupervisionData() {
        const workPlan = {
            objectives: document.getElementById('work-objectives').value,
            resourceAllocation: {
                clearingDebris: document.getElementById('clearing-assign').value,
                tillingSoil: document.getElementById('tilling-assign').value,
                applyingFertilizer: document.getElementById('fertilizer-assign').value,
                settingUpIrrigation: document.getElementById('irrigation-assign').value
            },
            timeline: document.getElementById('timeline').value,
            safetyConsiderations: document.getElementById('safety-considerations').value
        };
        
        const teamInstructions = {
            communicationMethod: getSelectedRadioValue('communication-method'),
            keyPoints: document.getElementById('key-points').value
        };
        
        const performanceIssue = {
            approach: getSelectedRadioValue('performance-approach'),
            response: getSelectedRadioValue('response-option')
        };
        
        const feedback = {
            positive: document.getElementById('positive-feedback').value,
            improvement: document.getElementById('improvement-feedback').value,
            actionPlan: document.getElementById('action-plan').value,
            followUp: document.getElementById('follow-up-plan').value
        };
        
        // Save to assessment data
        assessmentData.activities.staffSupervision.data = {
            workPlan: workPlan,
            teamInstructions: teamInstructions,
            performanceIssue: performanceIssue,
            feedback: feedback
        };
    }
    
    function getSelectedRadioValue(name) {
        const selected = document.querySelector(`input[name="${name}"]:checked`);
        return selected ? selected.value : '';
    }
    
    // Results download function
    function downloadResults() {
        // Convert assessment data to CSV format
        const csvContent = convertToCSV(assessmentData);
        
        // Create a blob and download link
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', 'RIST_Assessment_Results.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
    
    function convertToCSV(data) {
        // Create CSV header
        let csvRows = [];
        csvRows.push('RIST Interactive Assessment Results');
        csvRows.push('');
        csvRows.push('Assessment Details');
        csvRows.push(`Start Time,${formatDateTime(data.startTime)}`);
        csvRows.push(`End Time,${formatDateTime(data.endTime)}`);
        csvRows.push(`Duration (minutes),${data.startTime && data.endTime ? Math.round((new Date(data.endTime) - new Date(data.startTime)) / 60000) : ""}`);
        csvRows.push('');
        
        // WHS Meeting
        csvRows.push('WHS MEETING ACTIVITY');
        csvRows.push(`Completed,${data.activities.whsMeeting.completed ? "Yes" : "No"}`);
        if (data.activities.whsMeeting.data) {
            csvRows.push(`Meeting Objective,${escapeCsvValue(data.activities.whsMeeting.data.objective || "")}`);
            csvRows.push(`Agenda Items,${escapeCsvValue(data.activities.whsMeeting.data.agendaItems ? data.activities.whsMeeting.data.agendaItems.join("; ") : "")}`);
            csvRows.push(`Required Materials,${escapeCsvValue(data.activities.whsMeeting.data.materials || "")}`);
            csvRows.push('');
            csvRows.push('Hazard Approaches');
            if (data.activities.whsMeeting.data.chemicalHazard) {
                csvRows.push(`Chemical Hazard Approach,${data.activities.whsMeeting.data.chemicalHazard.approach || ""}`);
                csvRows.push(`Chemical Action Items,${escapeCsvValue(data.activities.whsMeeting.data.chemicalHazard.actionItems || "")}`);
            }
            if (data.activities.whsMeeting.data.equipmentHazard) {
                csvRows.push(`Equipment Hazard Approach,${data.activities.whsMeeting.data.equipmentHazard.approach || ""}`);
                csvRows.push(`Equipment Action Items,${escapeCsvValue(data.activities.whsMeeting.data.equipmentHazard.actionItems || "")}`);
            }
            if (data.activities.whsMeeting.data.ppeHazard) {
                csvRows.push(`PPE Hazard Approach,${data.activities.whsMeeting.data.ppeHazard.approach || ""}`);
                csvRows.push(`PPE Action Items,${escapeCsvValue(data.activities.whsMeeting.data.ppeHazard.actionItems || "")}`);
            }
            if (data.activities.whsMeeting.data.firstaidHazard) {
                csvRows.push(`First Aid Hazard Approach,${data.activities.whsMeeting.data.firstaidHazard.approach || ""}`);
                csvRows.push(`First Aid Action Items,${escapeCsvValue(data.activities.whsMeeting.data.firstaidHazard.actionItems || "")}`);
            }
            csvRows.push('');
            csvRows.push(`Meeting Summary,${escapeCsvValue(data.activities.whsMeeting.data.summary || "")}`);
            csvRows.push(`Follow-up Plan,${escapeCsvValue(data.activities.whsMeeting.data.followup || "")}`);
        }
        csvRows.push('');
        
        // Hazard Identification
        csvRows.push('HAZARD IDENTIFICATION ACTIVITY');
        csvRows.push(`Completed,${data.activities.hazardIdentification.completed ? "Yes" : "No"}`);
        csvRows.push(`Areas Inspected,${data.activities.hazardIdentification.data.inspections ? Object.keys(data.activities.hazardIdentification.data.inspections).join(", ") : ""}`);
        csvRows.push(`Risk Assessments Completed,${data.activities.hazardIdentification.data.riskAssessments ? data.activities.hazardIdentification.data.riskAssessments.length : 0}`);
        
        if (data.activities.hazardIdentification.data.riskAssessments && data.activities.hazardIdentification.data.riskAssessments.length > 0) {
            csvRows.push('');
            csvRows.push('Risk Assessments');
            csvRows.push('Area,Hazard,Risk Score,Control Measures,Responsible Person,Due Date');
            
            data.activities.hazardIdentification.data.riskAssessments.forEach(assessment => {
                csvRows.push(`${formatAreaName(assessment.area)},${escapeCsvValue(assessment.description)},${assessment.riskScore},${escapeCsvValue(assessment.controlMeasures.join("; "))},${assessment.responsiblePerson},${assessment.completionDate}`);
            });
        }
        csvRows.push('');
        
        // Emergency Response
        csvRows.push('EMERGENCY RESPONSE ACTIVITY');
        csvRows.push(`Completed,${data.activities.emergencyResponse.completed ? "Yes" : "No"}`);
        if (data.activities.emergencyResponse.data.immediateResponse) {
            csvRows.push(`Correct Response Actions,${data.activities.emergencyResponse.data.immediateResponse.correctCount}`);
            csvRows.push(`Incorrect Response Actions,${data.activities.emergencyResponse.data.immediateResponse.incorrectCount}`);
            csvRows.push(`Additional Instructions,${escapeCsvValue(data.activities.emergencyResponse.data.immediateResponse.additionalInstructions || "")}`);
        }
        
        if (data.activities.emergencyResponse.data.followupActions) {
            csvRows.push(`Follow-up Actions Selected,${data.activities.emergencyResponse.data.followupActions.length}`);
        }
        
        if (data.activities.emergencyResponse.data.incidentReport) {
            csvRows.push('');
            csvRows.push('Incident Report');
            const report = data.activities.emergencyResponse.data.incidentReport;
            csvRows.push(`Date and Time,${report.date || ""}`);
            csvRows.push(`Location,${escapeCsvValue(report.location || "")}`);
            csvRows.push(`Description,${escapeCsvValue(report.description || "")}`);
            csvRows.push(`Persons Involved,${escapeCsvValue(report.personsInvolved || "")}`);
            csvRows.push(`Injuries/Damage,${escapeCsvValue(report.injuryDescription || "")}`);
            csvRows.push(`Actions Taken,${escapeCsvValue(report.actionsTaken || "")}`);
            csvRows.push(`Root Cause,${escapeCsvValue(report.rootCause || "")}`);
            csvRows.push(`Preventive Measures,${escapeCsvValue(report.preventiveMeasures || "")}`);
        }
        csvRows.push('');
        
        // Staff Supervision
        csvRows.push('STAFF SUPERVISION ACTIVITY');
        csvRows.push(`Completed,${data.activities.staffSupervision.completed ? "Yes" : "No"}`);
        
        if (data.activities.staffSupervision.data && data.activities.staffSupervision.data.workPlan) {
            csvRows.push('');
            csvRows.push('Work Plan');
            csvRows.push(`Objectives,${escapeCsvValue(data.activities.staffSupervision.data.workPlan.objectives || "")}`);
            csvRows.push(`Timeline,${escapeCsvValue(data.activities.staffSupervision.data.workPlan.timeline || "")}`);
            csvRows.push(`Safety Considerations,${escapeCsvValue(data.activities.staffSupervision.data.workPlan.safetyConsiderations || "")}`);
            
            if (data.activities.staffSupervision.data.workPlan.resourceAllocation) {
                csvRows.push('');
                csvRows.push('Resource Allocation');
                const allocation = data.activities.staffSupervision.data.workPlan.resourceAllocation;
                csvRows.push(`Clearing Debris,${allocation.clearingDebris || "Not assigned"}`);
                csvRows.push(`Tilling Soil,${allocation.tillingSoil || "Not assigned"}`);
                csvRows.push(`Applying Fertilizer,${allocation.applyingFertilizer || "Not assigned"}`);
                csvRows.push(`Setting up Irrigation,${allocation.settingUpIrrigation || "Not assigned"}`);
            }
        }
        
        if (data.activities.staffSupervision.data && data.activities.staffSupervision.data.teamInstructions) {
            csvRows.push('');
            csvRows.push('Team Instructions');
            csvRows.push(`Communication Method,${data.activities.staffSupervision.data.teamInstructions.communicationMethod || ""}`);
            csvRows.push(`Key Points,${escapeCsvValue(data.activities.staffSupervision.data.teamInstructions.keyPoints || "")}`);
        }
        
        if (data.activities.staffSupervision.data && data.activities.staffSupervision.data.performanceIssue) {
            csvRows.push('');
            csvRows.push('Performance Issue');
            csvRows.push(`Approach,${data.activities.staffSupervision.data.performanceIssue.approach || ""}`);
            csvRows.push(`Response,${data.activities.staffSupervision.data.performanceIssue.response || ""}`);
        }
        
        if (data.activities.staffSupervision.data && data.activities.staffSupervision.data.feedback) {
            csvRows.push('');
            csvRows.push('Feedback');
            csvRows.push(`Positive Feedback,${escapeCsvValue(data.activities.staffSupervision.data.feedback.positive || "")}`);
            csvRows.push(`Areas for Improvement,${escapeCsvValue(data.activities.staffSupervision.data.feedback.improvement || "")}`);
            csvRows.push(`Action Plan,${escapeCsvValue(data.activities.staffSupervision.data.feedback.actionPlan || "")}`);
            csvRows.push(`Follow-up Plan,${escapeCsvValue(data.activities.staffSupervision.data.feedback.followUp || "")}`);
        }
        
        return csvRows.join('\n');
    }
    
    function escapeCsvValue(value) {
        if (!value) return '';
        // If the value contains a comma, quote, or newline, wrap it in quotes
        if (value.includes(',') || value.includes('"') || value.includes('\n')) {
            // Replace any double quotes with two double quotes
            return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
    }
    
    function formatDateTime(dateTimeStr) {
        if (!dateTimeStr) return '';
        const date = new Date(dateTimeStr);
        return date.toLocaleString('en-AU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    }
    
    // Initialize the assessment
    updateView();
    updateProgress();
    
    // Set default date for incident report to today
    const today = new Date();
    const formattedDate = today.toISOString().slice(0, 16);
    if (document.getElementById('incident-date')) {
        document.getElementById('incident-date').value = formattedDate;
    }
    
    // Mobile optimization - fix button display on small screens
    function adjustButtonsForMobile() {
        if (window.innerWidth < 640) {
            prevBtn.classList.add('w-full', 'mb-2');
            nextBtn.classList.add('w-full');
        } else {
            prevBtn.classList.remove('w-full', 'mb-2');
            nextBtn.classList.remove('w-full');
        }
    }
    
    // Call once on load and add resize listener
    adjustButtonsForMobile();
    window.addEventListener('resize', adjustButtonsForMobile);
});