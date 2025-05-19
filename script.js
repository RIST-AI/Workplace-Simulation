document.addEventListener('DOMContentLoaded', function() {
    // Global variables
    /* This is a string that will be part of the reportHtml in JavaScript */
    // Inside your DOMContentLoaded listener, where pdfStyles is defined:
    const pdfStyles = `
    <style>
        body { /* This will be the body of the printWindow div */
            font-family: Arial, Helvetica, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #ffffff; /* Crucial for html2canvas */
            font-size: 10pt;
        }
        .pdf-wrapper {
            width: 100%;
            max-width: 780px;
            margin: 0 auto;
            padding: 20px;
            padding-bottom: 60px; /* << INCREASE THIS VALUE (e.g., from 20px to 50px, 60px, or even more) */
            box-sizing: border-box;
        }
        .pdf-main-header { /* ... */ }
        .pdf-section { /* ... */ }
        .pdf-section:last-of-type { /* ... */ }
        .pdf-section-title { /* ... */ }
        .pdf-subsection-title { /* ... */ }
        /* Styles for .pdf-item, .pdf-table etc. can remain as they were before the Q&A block */
        .pdf-item { /* General item, can still be used if not Q&A */
            margin-bottom: 8px;
        }
        .pdf-item-label {
            font-weight: bold;
            color: #444444;
            display: inline-block;
            min-width: 150px;
            vertical-align: top;
        }
        .pdf-item-value {
            display: inline-block;
            word-break: break-word;
        }
        .pdf-table { /* ... */ }
        .pdf-table th, .pdf-table td { /* ... */ }
        .pdf-table th { /* ... */ }
        .pdf-table tr:nth-child(even) { /* ... */ }
        .student-info-block { /* ... */ }
        .activity-block { /* ... */ }
        .pdf-footer-note { /* ... */ }

        /* CORRECT Q&A STYLES TO KEEP (Flexbox version) */
        .pdf-qa-block {
            margin-top: 15px; /* <<< ADD THIS LINE (or adjust value as needed, e.g., 10px) */
            margin-bottom: 15px;
            padding: 10px;
            border: 1px solid #e0e0e0;
            border-radius: 5px;
            background-color: #f9f9f9;
        }
        .pdf-question-text {
            font-weight: bold;
            color: #1E3F61;
            margin-bottom: 8px; /* Increased space after question */
            display: block;
        }
        .pdf-question-text::before {
            content: "Question: ";
            font-weight: bold;
        }
        .pdf-answer-wrapper {
            display: flex; /* Use flexbox */
            align-items: flex-start; /* Align items to the top */
            margin-left: 15px; /* Keep the indent */
        }
        .pdf-answer-label {
            font-weight: bold;
            color: #333;
            margin-right: 8px; /* Increased space after label */
            flex-shrink: 0; /* Prevent label from shrinking */
            padding-top: 4px; /* Align baseline of label with first line of answer text if answer has padding */
        }
        .pdf-answer-text {
            background-color: #ffffff;
            padding: 4px 6px;
            border-radius: 3px;
            border: 1px solid #eaeaea;
            word-break: break-word;
            flex-grow: 1; /* Allow answer text to take remaining space */
        }
        .pdf-answer-list { /* If you use lists for answers */
            margin-left: 15px; /* This is relative to its parent, .pdf-answer-wrapper, which is already indented */
            /* If .pdf-answer-wrapper has margin-left: 15px, and .pdf-answer-label is present,
               you might want padding-left: 0; on the ul and let the label provide the initial indent.
               Or, if the label is part of the list item, adjust accordingly.
               The current setup with flex might make this margin-left: 15px on the list itself look like a double indent
               if the label is also present.
               Let's try margin-left: 0; and rely on the wrapper's indent.
            */
            margin-left: 0; /* Changed from 15px */
            padding-left: 20px; /* This will be the indent from the "Student's Answers:" label */
            list-style-type: disc;
            margin-top: 5px;
        }
        .pdf-answer-list-item {
            background-color: #ffffff;
            padding: 3px 5px;
            border-radius: 3px;
            margin-bottom: 4px;
            border: 1px solid #eaeaea;
        }
    </style>
    `;
    let assessmentData = {
        studentName: "",
        unitCode: "",
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
                    identifiedHazards: {},
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
    
    let currentSection = "student-info-section"; // CHANGED - start with student info
    let studentInfoSubmitted = false; // ADDED - flag
    // Place this somewhere accessible, e.g., near your other data objects like hazardData
    const questionTexts = {
        whsMeeting: {
            objective: "Meeting Objective:",
            agendaItems: "Meeting Agenda Items:",
            materials: "Required Materials/Resources:",
            chemicalHazardApproach: "Chemical Storage Area Hazard: How will you address this hazard with your team?",
            chemicalHazardActionItems: "Chemical Storage Area Hazard: Action Items:",
            equipmentHazardApproach: "Equipment Shed Hazard: How will you address this hazard with your team?",
            equipmentHazardActionItems: "Equipment Shed Hazard: Action Items:",
            ppeHazardApproach: "Field Operations PPE Hazard: How will you address this hazard with your team?",
            ppeHazardActionItems: "Field Operations PPE Hazard: Action Items:",
            firstaidHazardApproach: "First Aid and Emergency Contact Hazard: How will you address this hazard with your team?",
            firstaidHazardActionItems: "First Aid and Emergency Contact Hazard: Action Items:",
            summary: "Meeting Summary:",
            followup: "Follow-up Plan:"
        },
        hazardIdentification: {
            // For risk assessments, the "question" is implicit in the fields
            // We can add a general intro or handle it within the loop
        },
        emergencyResponse: {
            immediateResponseSelectedActions: "Immediate Response: What are your immediate instructions to Sarah? (Selected Actions)",
            immediateResponseAdditionalInstructions: "Immediate Response: Additional Instructions:",
            // For incident report, fields are self-explanatory
        },
        staffSupervision: {
            workPlanObjectives: "Work Plan: Work Objectives:",
            workPlanResourceAllocationClearing: "Work Plan Resource Allocation: Clearing Debris:",
            workPlanResourceAllocationTilling: "Work Plan Resource Allocation: Tilling Soil:",
            workPlanResourceAllocationFertilizer: "Work Plan Resource Allocation: Applying Fertilizer:",
            workPlanResourceAllocationIrrigation: "Work Plan Resource Allocation: Setting up Irrigation:",
            workPlanTimeline: "Work Plan: Timeline:",
            workPlanSafetyConsiderations: "Work Plan: Safety Considerations:",
            teamInstructionsCommunicationMethod: "Team Instructions: How will you communicate the work plan to your team?",
            teamInstructionsKeyPoints: "Team Instructions: Key Points to Communicate:",
            performanceIssueApproach: "Performance Issue: How will you address this issue?",
            performanceIssueResponse: "Performance Issue (Conversation with David): How do you respond?",
            feedbackPositive: "Constructive Feedback: Positive Feedback:",
            feedbackImprovement: "Constructive Feedback: Areas for Improvement:",
            feedbackActionPlan: "Constructive Feedback: Action Plan:",
            feedbackFollowUp: "Constructive Feedback: Follow-up Plan:"
        }
        // Add more as needed for other parts of your assessment
    };
    function escapeHtml(unsafe) {
        if (typeof unsafe !== 'string') {
            // If it's not a string (e.g., null, undefined, number), return it as is or a placeholder
            if (unsafe === null || typeof unsafe === 'undefined') return 'N/A';
            return String(unsafe); // Convert numbers/booleans to string
        }
        return unsafe
             .replace(/&/g, "&amp;")
             .replace(/</g, "&lt;")
             .replace(/>/g, "&gt;")
             .replace(/"/g, "&quot;")
             .replace(/'/g, "&#039;");
    }

    // Helper to get question text
    function getQuestionText(section, key, subKey = null, subSubKey = null) {
        if (subSubKey && questionTexts[section] && questionTexts[section][key] && questionTexts[section][key][subKey] && questionTexts[section][key][subKey][subSubKey]) {
            return questionTexts[section][key][subKey][subSubKey];
        }
        if (subKey && questionTexts[section] && questionTexts[section][key] && questionTexts[section][key][subKey]) {
            return questionTexts[section][key][subKey];
        }
        if (questionTexts[section] && questionTexts[section][key]) {
            return questionTexts[section][key];
        }
        return ""; // Fallback if question text not found
    }
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
    const studentNameInput = document.getElementById('student-name'); // ADDED
    const unitCodeInput = document.getElementById('unit-code');       // ADDED
    const submitStudentInfoBtn = document.getElementById('submit-student-info-btn'); // ADDED
    const nextBtn = document.getElementById('next-btn');
    const progressBar = document.getElementById('progress-bar');
    const currentActivity = document.getElementById('current-activity');
    
    // Activity-specific buttons
    const introBtn = document.getElementById('intro-continue-btn');
    const whsBtn = document.getElementById('whs-complete-btn');
    const hazardBtn = document.getElementById('hazard-complete-btn');
    const emergencyBtn = document.getElementById('emergency-complete-btn');
    const supervisionBtn = document.getElementById('supervision-complete-btn');
    const downloadBtn = document.getElementById('download-results');
    
    // Navigation order
    const sections = [
        "student-info-section",
        "welcome-screen",       // ADD "welcome-screen" HERE
        "introduction",
        "whs-meeting",
        "hazard-identification",
        "emergency-response",
        "staff-supervision",
        "assessment-complete"
    ];
        
    submitStudentInfoBtn.addEventListener('click', function() {
        const name = studentNameInput.value.trim();
        const unit = unitCodeInput.value.trim();

        if (!name) {
            alert('Please enter your Full Name.');
            studentNameInput.focus();
            return;
        }
        if (!unit) {
            alert('Please enter the Unit Code.');
            unitCodeInput.focus();
            return;
        }

        assessmentData.studentName = name;
        assessmentData.unitCode = unit;
        studentInfoSubmitted = true;

        // Hide student info, show welcome screen
        document.getElementById('student-info-section').classList.add('hidden');
        document.getElementById('welcome-screen').classList.remove('hidden');
        currentSection = "welcome-screen";
        updateProgress();
        updateView(); // Call updateView to correctly set button states etc. for welcome screen
    });
    // Start assessment
    startBtn.addEventListener('click', function() {
        // This check is technically redundant if student info must be submitted first,
        // but good for robustness.
        if (!studentInfoSubmitted) {
            alert("Please complete the student information section first.");
            // Potentially navigate back to student-info if needed, or just block.
            // For now, this alert should suffice as they can't reach welcome-screen without submitting.
            return;
        }
        document.getElementById('welcome-screen').classList.add('hidden');
        document.getElementById('assessment-container').classList.remove('hidden');
        document.getElementById('introduction').classList.remove('hidden');
        currentSection = "introduction";
        updateProgress();
        updateView();
        // Record start time (actual assessment activities begin)
        if (!assessmentData.startTime) { // Only set if not already set
            assessmentData.startTime = new Date().toISOString();
        }
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
        if (!studentInfoSubmitted && currentSection === "student-info-section") {
            alert("Please submit your student information before proceeding.");
            return;
        }
        const currentIndex = sections.indexOf(currentSection);
        if (currentIndex < sections.length - 1) {
            currentSection = sections[currentIndex + 1];
        }
        
        updateView();
        updateProgress();
    }
    
    function navigateToPrevious() {
        const currentIndex = sections.indexOf(currentSection);
    
        // The prevBtn should be disabled by updateView() if currentIndex is 0 or 1.
        // This check is a safeguard.
        if (currentIndex > 0) {
            // Determine the target section
            const targetSection = sections[currentIndex - 1];
    
            // If studentInfoSubmitted is true, and we are trying to go back to student-info-section,
            // the inputs on student-info-section will be disabled by updateView().
            // No special alert is needed here as per the current structure,
            // as updateView handles the state of the student info form.
            // The prevBtn on 'welcome-screen' is already disabled, preventing direct navigation
            // from 'welcome-screen' to 'student-info-section' via this button.
    
            currentSection = targetSection;
            updateView();
            updateProgress();
        }
        // If currentIndex is 0, this function shouldn't be callable because prevBtn would be disabled.
    }
    
    function updateView() {
        // Hide all content sections
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.add('hidden');
        });
        
        // Show current section
        const currentSectionElement = document.getElementById(currentSection);
        if (currentSectionElement) {
            currentSectionElement.classList.remove('hidden');
        } else {
            console.error("Current section element not found:", currentSection);
            return;
        }
        
        // Update buttons
        const currentIndex = sections.indexOf(currentSection);
        prevBtn.disabled = currentIndex === 0 || (currentIndex === 1 && sections[0] === "student-info-section");
        
        if (studentInfoSubmitted && currentSection === "student-info-section") {
            studentNameInput.disabled = true;
            unitCodeInput.disabled = true;
            submitStudentInfoBtn.disabled = true;
            submitStudentInfoBtn.textContent = "Information Submitted";
            submitStudentInfoBtn.classList.add('opacity-50', 'cursor-not-allowed');
        } else if (currentSection === "student-info-section") {
            studentNameInput.disabled = false;
            unitCodeInput.disabled = false;
            submitStudentInfoBtn.disabled = false;
            submitStudentInfoBtn.innerHTML = '<i class="fas fa-arrow-right mr-2"></i> Continue to Assessment';
            submitStudentInfoBtn.classList.remove('opacity-50', 'cursor-not-allowed');
        }

        if (currentIndex === sections.length - 1) {
            nextBtn.classList.add('hidden');
        } else {
            nextBtn.classList.remove('hidden');
        }
        if (currentSection === "student-info-section" || currentSection === "welcome-screen") {
            nextBtn.classList.add('hidden');
        } else {
            // For all other sections, the generic nextBtn is fine
            // (unless it's the last section, handled above)
            if (currentIndex < sections.length - 1) {
                 nextBtn.classList.remove('hidden');
            }
        }
        
        // Update current activity label
        let activityLabel = "";
        if (currentSection === "student-info-section") {
            activityLabel = "Student Information";
        } else if (currentSection === "welcome-screen") {
            activityLabel = "Welcome";
        } else {
            activityLabel = currentSection.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
        }
        currentActivity.textContent = activityLabel;
        if (currentSection === "hazard-identification") {
            updateHazardSelect();
        }
        // Show/hide assessment container vs student info
        if (currentSection === "student-info-section") {
            document.getElementById('assessment-container').classList.add('hidden');
        } else if (currentSection !== "welcome-screen") { // welcome-screen is handled by its own button
            document.getElementById('assessment-container').classList.remove('hidden');
        }
    }
    
    
    function updateProgress() {
        const currentIndex = sections.indexOf(currentSection);
        const progressPercentage = (currentIndex / (sections.length - 1)) * 100;
        progressBar.style.width = `${progressPercentage}%`;
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
    
    // --- Hazard Identification ---
    function showInspectionResults(area) {
        const inspectionResultsDiv = document.getElementById('inspection-results');
        const inspectionAreaSpan = document.getElementById('inspection-area');
        const hazardsFoundDiv = document.getElementById('hazards-found');
        
        // Show the inspection results container and set the area name
        inspectionResultsDiv.classList.remove('hidden');
        inspectionAreaSpan.textContent = formatAreaName(area); // formatAreaName is a helper you have
        
        // Clear out hazards from any previously inspected area displayed in the DOM
        hazardsFoundDiv.innerHTML = '';
        
        const hazIdData = assessmentData.activities.hazardIdentification.data;

        // Check if hazard data exists for the given area
        if (hazardData[area]) {
            hazardData[area].forEach(hazard => {
                // Create a unique ID for the checkbox: "hazard-[areaName]-[originalHazardId]"
                // e.g., "hazard-chemical-chem1"
                const checkboxId = `hazard-${area}-${hazard.id}`; 

                const hazardDiv = document.createElement('div');
                hazardDiv.className = 'p-3 bg-white border border-gray-300 rounded-md flex items-center shadow-sm';
                
                // Populate the div with the checkbox and label
                // Ensure data attributes are correctly set for use in handleHazardCheckboxChange
                hazardDiv.innerHTML = `
                    <input type="checkbox" id="${checkboxId}" 
                            class="mr-3 h-5 w-5 text-rist-orange focus:ring-rist-orange border-gray-400 rounded identified-hazard" 
                            data-area="${area}" 
                            data-description="${escapeHtml(hazard.description)}"
                            data-original-id="${hazard.id}">
                    <label for="${checkboxId}" class="text-gray-700">${escapeHtml(hazard.description)}</label>
                `;
                hazardsFoundDiv.appendChild(hazardDiv);

                // Get the newly added checkbox element
                const currentCheckbox = document.getElementById(checkboxId);

                // Set its initial checked state based on what's stored in assessmentData
                // The '!!' converts the value (or undefined) to a boolean
                currentCheckbox.checked = !!hazIdData.identifiedHazards[checkboxId]; 

                // Remove any existing event listener to prevent duplicates if this function is called multiple times
                // for the same conceptual area (though typically it's for new areas)
                currentCheckbox.removeEventListener('change', handleHazardCheckboxChange);
                // Add the event listener to handle changes to this checkbox
                currentCheckbox.addEventListener('change', handleHazardCheckboxChange);
            });
        } else {
            // Optional: Display a message if no predefined hazards for this area
            hazardsFoundDiv.innerHTML = '<p class="text-gray-600 italic">No specific predefined hazards listed for this area. You can add any observed hazards below.</p>';
        }
        
        // Optionally, mark this area as inspected in assessmentData
        // This could be useful for tracking which areas the student has looked at
        if (!hazIdData.inspections[area]) {
            hazIdData.inspections[area] = { 
                inspected: true, 
                timestamp: new Date().toISOString() 
            };
        }
        
        // Note: updateHazardSelect() is not called directly here.
        // It will be called by handleHazardCheckboxChange when a checkbox state actually changes,
        // or when the entire "hazard-identification" section is first loaded (via updateView).
        // This ensures the dropdown reflects the accumulated state from assessmentData.
    }
    
    // Create a dedicated handler function for checkbox changes
function handleHazardCheckboxChange(event) {
    const checkbox = event.target;
    const hazardId = checkbox.id;
    const hazIdData = assessmentData.activities.hazardIdentification.data;

    if (checkbox.checked) {
        // Store the full hazard details if you need them later, or just true
        // Assuming hazardData is globally accessible or passed appropriately
        const area = checkbox.dataset.area;
        const description = checkbox.dataset.description;
        hazIdData.identifiedHazards[hazardId] = {
            id: hazardId,
            area: area,
            description: description
            // You could add more details from hazardData[area] if needed
        };
    } else {
        delete hazIdData.identifiedHazards[hazardId];
    }
    updateHazardSelect(); // Refresh the dropdown
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
        const instructionText = document.getElementById('hazard-select-instruction'); // Assuming you have this
        const riskAssessmentForm = document.getElementById('risk-assessment-form');
        const hazIdData = assessmentData.activities.hazardIdentification.data;
    
        const currentSelectedValue = hazardSelect.value; // Preserve current selection if possible
    
        hazardSelect.innerHTML = ''; // Clear existing options
    
        let placeholderText = "-- Select a Hazard to Assess --";
        let hazardsAvailable = 0;
    
        // Populate from assessmentData.identifiedHazards
        for (const hazardId in hazIdData.identifiedHazards) {
            if (hazIdData.identifiedHazards.hasOwnProperty(hazardId)) {
                const hazardDetails = hazIdData.identifiedHazards[hazardId]; // This should be the object we stored
                if (hazardDetails && typeof hazardDetails === 'object') { // Ensure it's the object
                    const option = document.createElement('option');
                    option.value = hazardDetails.id; // Use the stored ID (e.g., hazard-chemical-chem1)
                    option.dataset.area = hazardDetails.area;
                    option.dataset.description = hazardDetails.description;
                    option.textContent = `${formatAreaName(hazardDetails.area)}: ${escapeHtml(hazardDetails.description)}`;
                    hazardSelect.appendChild(option);
                    hazardsAvailable++;
                }
            }
        }
    
        // Add placeholder
        const placeholderOption = document.createElement('option');
        placeholderOption.value = "";
        
        if (hazardsAvailable === 0) {
            placeholderOption.textContent = "-- First, identify hazards by inspecting areas --";
            hazardSelect.insertBefore(placeholderOption, hazardSelect.firstChild); // Add placeholder at the beginning
            hazardSelect.value = ""; // Select placeholder
            hazardSelect.disabled = true;
            if (instructionText) instructionText.classList.remove('hidden');
            riskAssessmentForm.classList.add('hidden');
        } else {
            placeholderOption.textContent = placeholderText;
            hazardSelect.insertBefore(placeholderOption, hazardSelect.firstChild); // Add placeholder
            hazardSelect.disabled = false;
            if (instructionText) instructionText.classList.add('hidden');
            
            // Try to reselect previous value
            if (Array.from(hazardSelect.options).some(opt => opt.value === currentSelectedValue) && currentSelectedValue !== "") {
                hazardSelect.value = currentSelectedValue;
            } else {
                hazardSelect.value = ""; // Default to placeholder if previous selection is gone or was placeholder
            }
        }
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
    
    // Inside your DOMContentLoaded listener:

function downloadResults() {
    const downloadButton = document.getElementById('download-results');
    const originalButtonText = downloadButton.textContent;
    downloadButton.textContent = 'Generating PDF...';
    downloadButton.disabled = true;

    const reportHtml = formatDataForPdf(assessmentData);

    const printWindow = document.createElement('div');
    printWindow.style.position = 'absolute';
    printWindow.style.left = '-9999px';
    printWindow.style.top = '0px';
    printWindow.style.width = '800px'; // A good rendering width for A4-like content
    printWindow.style.backgroundColor = '#ffffff';
    printWindow.innerHTML = reportHtml;
    document.body.appendChild(printWindow);

    const contentToCapture = printWindow.querySelector('.pdf-wrapper');

    html2canvas(contentToCapture, {
        scale: 2, // Improves quality
        useCORS: true,
        logging: false, // Set to true for debugging html2canvas
        width: contentToCapture.scrollWidth, // Capture the actual rendered width of the content
        height: contentToCapture.scrollHeight, // Capture the full scrollable height
        windowWidth: contentToCapture.scrollWidth, // Important for layout consistency
        windowHeight: contentToCapture.scrollHeight
    }).then(canvas => {
        document.body.removeChild(printWindow);

        const pdf = new jspdf.jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        const pageMargin = 15; // mm - give more margin
        const pdfWidth = pdf.internal.pageSize.getWidth() - (2 * pageMargin);
        const pdfHeight = pdf.internal.pageSize.getHeight() - (2 * pageMargin);

        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;

        // Calculate the height of the canvas image when scaled to fit the PDF width
        const ratio = pdfWidth / canvasWidth;
        const scaledCanvasHeight = canvasHeight * ratio;

        let yPositionOnCanvas = 0; // Current Y position on the source canvas (in canvas pixels)
        let pageCount = 0;

        while (yPositionOnCanvas < canvasHeight) {
            if (pageCount > 0) {
                pdf.addPage();
            }

            // Calculate the height of the slice to take from the canvas for the current PDF page
            // This is pdfHeight in PDF units, converted back to canvas pixel units
            let sliceHeightInCanvasPixels = (pdfHeight / ratio);

            // If the remaining canvas is less than a full slice, take only what's left
            if (yPositionOnCanvas + sliceHeightInCanvasPixels > canvasHeight) {
                sliceHeightInCanvasPixels = canvasHeight - yPositionOnCanvas;
            }

            // Create a temporary canvas to hold the slice
            const sliceCanvas = document.createElement('canvas');
            sliceCanvas.width = canvasWidth;
            sliceCanvas.height = sliceHeightInCanvasPixels;
            const sliceCtx = sliceCanvas.getContext('2d');

            // Draw the slice from the main canvas to the temporary sliceCanvas
            // Parameters: sourceImage, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight
            sliceCtx.drawImage(canvas,
                0, yPositionOnCanvas, // Source X, Y (from main canvas)
                canvasWidth, sliceHeightInCanvasPixels, // Source Width, Height (of the slice)
                0, 0, // Destination X, Y (on sliceCanvas)
                canvasWidth, sliceHeightInCanvasPixels // Destination Width, Height (on sliceCanvas)
            );

            const sliceImgData = sliceCanvas.toDataURL('image/png', 1.0); // Use PNG

            // Calculate the height of this slice when added to the PDF
            const slicePdfHeight = sliceHeightInCanvasPixels * ratio;

            pdf.addImage(sliceImgData, 'PNG', pageMargin, pageMargin, pdfWidth, slicePdfHeight);

            yPositionOnCanvas += sliceHeightInCanvasPixels;
            pageCount++;

            if (pageCount > 25) { // Safety break for extremely long content
                console.warn("PDF generation stopped after 25 pages.");
                break;
            }
        }

        pdf.save(`RIST_Assessment_${escapeHtml(assessmentData.studentName) || 'Results'}.pdf`);
        
        downloadButton.textContent = originalButtonText;
        downloadButton.disabled = false;
        alert('Your PDF report has been generated and downloaded.');

    }).catch(err => {
        console.error('Error generating PDF:', err);
        if (document.body.contains(printWindow)) { // Check if printWindow still exists
            document.body.removeChild(printWindow);
        }
        downloadButton.textContent = originalButtonText;
        downloadButton.disabled = false;
        alert('An error occurred while generating the PDF. Please check the console for details.');
    });
}
    
    function formatDateTimeForPdf(dateTimeStr) {
        if (!dateTimeStr) return 'N/A';
        try {
            const date = new Date(dateTimeStr);
            return date.toLocaleString('en-AU', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            });
        } catch (e) {
            return dateTimeStr; // Fallback
        }
    }
    
    function formatDataForPdf(data) {
        let html = `${pdfStyles}<div class="pdf-wrapper">`;
        html += `<h1 class="pdf-main-header">RIST Assessment Results</h1>`;
    
        // Student Information (remains similar)
        html += `<div class="pdf-section student-info-block">`;
        html += `<h2 class="pdf-section-title">Student Information</h2>`;
        html += `<p class="pdf-item"><span class="pdf-item-label">Name:</span> <span class="pdf-item-value">${escapeHtml(data.studentName) || 'N/A'}</span></p>`;
        html += `<p class="pdf-item"><span class="pdf-item-label">Unit Code:</span> <span class="pdf-item-value">${escapeHtml(data.unitCode) || 'N/A'}</span></p>`;
        html += `<p class="pdf-item"><span class="pdf-item-label">Assessment Started:</span> <span class="pdf-item-value">${formatDateTimeForPdf(data.startTime)}</span></p>`;
        html += `<p class="pdf-item"><span class="pdf-item-label">Assessment Ended:</span> <span class="pdf-item-value">${formatDateTimeForPdf(data.endTime)}</span></p>`;
        if (data.startTime && data.endTime) {
            const duration = Math.round((new Date(data.endTime) - new Date(data.startTime)) / 60000);
            html += `<p class="pdf-item"><span class="pdf-item-label">Duration:</span> <span class="pdf-item-value">${duration} minutes</span></p>`;
        }
        html += `</div>`;
    
        // --- Helper functions defined INSIDE formatDataForPdf ---
        const addQA = (questionKey, answerValue, sectionName = 'whsMeeting') => {
            const qText = getQuestionText(sectionName, questionKey);
            let blockHtml = `<div class="pdf-qa-block">`;
            if (qText) {
                blockHtml += `<span class="pdf-question-text">${escapeHtml(qText)}</span>`;
            }
            blockHtml += `<div class="pdf-answer-wrapper">`;
            blockHtml += `<span class="pdf-answer-label">Student's Answer:</span>`;
            blockHtml += `<span class="pdf-answer-text">${escapeHtml(answerValue) || 'N/A'}</span>`;
            blockHtml += `</div></div>`;
            html += blockHtml; // Append to the main html string
        };
        
        const addQAList = (questionKey, answerArray, sectionName = 'whsMeeting') => {
            const qText = getQuestionText(sectionName, questionKey);
            let blockHtml = `<div class="pdf-qa-block">`;
            if (qText) {
                blockHtml += `<span class="pdf-question-text">${escapeHtml(qText)}</span>`;
            }
            blockHtml += `<div class="pdf-answer-wrapper">`;
            blockHtml += `<span class="pdf-answer-label">Student's Answers:</span>`;
            if (answerArray && answerArray.length > 0) {
                blockHtml += `<ul class="pdf-answer-list">`;
                answerArray.forEach(item => {
                    blockHtml += `<li class="pdf-answer-list-item">${escapeHtml(item)}</li>`;
                });
                blockHtml += `</ul>`;
            } else {
                blockHtml += `<span class="pdf-answer-text">N/A</span>`;
            }
            blockHtml += `</div></div>`;
            html += blockHtml; // Append to the main html string
        };
        // --- End of helper functions ---
    
    
        // --- WHS Meeting ---
        if (data.activities.whsMeeting && data.activities.whsMeeting.completed) {
            const whs = data.activities.whsMeeting.data;
            html += `<div class="pdf-section">`;
            html += `<h2 class="pdf-section-title">WHS Meeting Activity</h2>`;
    
            addQA('objective', whs.objective); // Now addQA is in scope
            addQAList('agendaItems', whs.agendaItems);
            addQA('materials', whs.materials);
            
            html += `<h3 class="pdf-subsection-title">Hazard Approaches:</h3>`;
            const hazards = [
                { key: 'chemicalHazard', approachKey: 'chemicalHazardApproach', actionKey: 'chemicalHazardActionItems', name: 'Chemical Storage Area' },
                { key: 'equipmentHazard', approachKey: 'equipmentHazardApproach', actionKey: 'equipmentHazardActionItems', name: 'Equipment Shed' },
                { key: 'ppeHazard', approachKey: 'ppeHazardApproach', actionKey: 'ppeHazardActionItems', name: 'Field Operations PPE' },
                { key: 'firstaidHazard', approachKey: 'firstaidHazardApproach', actionKey: 'firstaidHazardActionItems', name: 'First Aid and Emergency Contact' }
            ];
    
            hazards.forEach(hazInfo => {
                if (whs[hazInfo.key]) {
                    html += `<div class="activity-block">`;
                    html += `<h4 style="margin-top:0; margin-bottom: 10px; color: #1E3F61;">${escapeHtml(hazInfo.name)}:</h4>`;
                    addQA(hazInfo.approachKey, whs[hazInfo.key].approach);
                    addQA(hazInfo.actionKey, whs[hazInfo.key].actionItems);
                    html += `</div>`;
                }
            });
    
            html += `<div style="margin-top:15px;">`;
            addQA('summary', whs.summary);
            addQA('followup', whs.followup);
            html += `</div>`;
            html += `</div>`; // End WHS Section
        }
    
        // --- Hazard Identification ---
        if (data.activities.hazardIdentification && data.activities.hazardIdentification.completed) {
            const hazId = data.activities.hazardIdentification.data;
            html += `<div class="pdf-section">`;
            html += `<h2 class="pdf-section-title">Hazard Identification Activity</h2>`;
            const inspectedAreas = hazId.inspections ? Object.keys(hazId.inspections).map(area => formatAreaName(area)).join(', ') : 'None';
            
            // Using a direct HTML structure here as it's not a standard Q&A
            html += `<div class="pdf-qa-block"><span class="pdf-question-text">Areas Inspected by Student:</span><div class="pdf-answer-wrapper"><span class="pdf-answer-text">${escapeHtml(inspectedAreas)}</span></div></div>`;
            
            if (hazId.riskAssessments && hazId.riskAssessments.length > 0) {
                html += `<h3 class="pdf-subsection-title">Risk Assessments Conducted:</h3>`;
                html += `<table class="pdf-table"><thead><tr><th>Hazard Description</th><th>Area</th><th>Likelihood</th><th>Consequence</th><th>Risk Score</th><th>Control Measures</th><th>Control Details</th><th>Responsible</th><th>Due Date</th></tr></thead><tbody>`;
                hazId.riskAssessments.forEach(ra => {
                    html += `<tr>`;
                    html += `<td>${escapeHtml(ra.description)}</td>`;
                    html += `<td>${escapeHtml(formatAreaName(ra.area))}</td>`;
                    html += `<td>${escapeHtml(ra.likelihood)}</td>`;
                    html += `<td>${escapeHtml(ra.consequence)}</td>`;
                    html += `<td>${escapeHtml(ra.riskScore)}</td>`;
                    html += `<td>${(ra.controlMeasures && ra.controlMeasures.length > 0) ? escapeHtml(ra.controlMeasures.join('; ')) : 'N/A'}</td>`;
                    html += `<td>${escapeHtml(ra.controlDetails) || 'N/A'}</td>`;
                    html += `<td>${escapeHtml(ra.responsiblePerson)}</td>`;
                    html += `<td>${escapeHtml(ra.completionDate)}</td>`;
                    html += `</tr>`;
                });
                html += `</tbody></table>`;
            } else {
                html += `<p class="pdf-item">No risk assessments completed.</p>`;
            }
            html += `</div>`;
        }
    
        // --- Emergency Response ---
        if (data.activities.emergencyResponse && data.activities.emergencyResponse.completed) {
            const er = data.activities.emergencyResponse.data;
            html += `<div class="pdf-section">`;
            html += `<h2 class="pdf-section-title">Emergency Response Activity</h2>`;
            if (er.immediateResponse) {
                html += `<h3 class="pdf-subsection-title">Immediate Response:</h3>`;
                addQA('immediateResponseSelectedActions', er.immediateResponse.selectedActions ? er.immediateResponse.selectedActions.join(', ') : 'N/A', 'emergencyResponse');
                addQA('immediateResponseAdditionalInstructions', er.immediateResponse.additionalInstructions, 'emergencyResponse');
            }
            if (er.incidentReport) {
                html += `<h3 class="pdf-subsection-title" style="margin-top:15px;">Incident Report Filed:</h3>`;
                const report = er.incidentReport;
                html += `<div class="activity-block" style="background-color: #f9f9f9; border-color: #e0e0e0;">`;
                for (const key in report) {
                    const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                    html += `<div class="pdf-qa-block" style="border:none; padding: 5px 0; background-color:transparent;">`;
                    html += `<span class="pdf-question-text" style="color:#555;">${escapeHtml(label)}:</span>`;
                    html += `<div class="pdf-answer-wrapper"><span class="pdf-answer-text">${escapeHtml(report[key]) || 'N/A'}</span></div>`;
                    html += `</div>`;
                }
                html += `</div>`;
            }
            html += `</div>`;
        }
    
        // --- Staff Supervision ---
        if (data.activities.staffSupervision && data.activities.staffSupervision.completed) {
            const sup = data.activities.staffSupervision.data;
            html += `<div class="pdf-section">`;
            html += `<h2 class="pdf-section-title">Staff Supervision Activity</h2>`;
            
            // Define addSupQA specific to this section if needed, or just use addQA with 'staffSupervision'
            const addSupQA = (questionKey, answerValue) => {
                addQA(questionKey, answerValue, 'staffSupervision');
            };
                
            if (sup.workPlan) {
                html += `<h3 class="pdf-subsection-title">Work Plan:</h3>`;
                addSupQA('workPlanObjectives', sup.workPlan.objectives);
                
                html += `<div class="pdf-qa-block">`;
                html += `<span class="pdf-question-text">Work Plan Resource Allocation:</span>`; // This is the "Question" for the block
                html += `<div class="pdf-answer-wrapper">`;
                if (sup.workPlan.resourceAllocation) {
                    const ra = sup.workPlan.resourceAllocation;
                    // For each item in resource allocation, we can treat the sub-item as a label
                    html += `<p class="pdf-item" style="margin-bottom:3px;"><span class="pdf-answer-label" style="min-width:120px;">Clearing Debris:</span> <span class="pdf-answer-text">${escapeHtml(ra.clearingDebris) || 'N/A'}</span></p>`;
                    html += `<p class="pdf-item" style="margin-bottom:3px;"><span class="pdf-answer-label" style="min-width:120px;">Tilling Soil:</span> <span class="pdf-answer-text">${escapeHtml(ra.tillingSoil) || 'N/A'}</span></p>`;
                    html += `<p class="pdf-item" style="margin-bottom:3px;"><span class="pdf-answer-label" style="min-width:120px;">Applying Fertilizer:</span> <span class="pdf-answer-text">${escapeHtml(ra.applyingFertilizer) || 'N/A'}</span></p>`;
                    html += `<p class="pdf-item"><span class="pdf-answer-label" style="min-width:120px;">Setting up Irrigation:</span> <span class="pdf-answer-text">${escapeHtml(ra.settingUpIrrigation) || 'N/A'}</span></p>`;
                } else { html += `<span class="pdf-answer-text">N/A</span>`; }
                html += `</div></div>`;
    
                addSupQA('workPlanTimeline', sup.workPlan.timeline);
                addSupQA('workPlanSafetyConsiderations', sup.workPlan.safetyConsiderations);
            }
            if (sup.teamInstructions) {
                html += `<h3 class="pdf-subsection-title">Team Instructions:</h3>`;
                addSupQA('teamInstructionsCommunicationMethod', sup.teamInstructions.communicationMethod);
                addSupQA('teamInstructionsKeyPoints', sup.teamInstructions.keyPoints);
            }
            if (sup.performanceIssue) {
                html += `<h3 class="pdf-subsection-title">Performance Issue:</h3>`;
                addSupQA('performanceIssueApproach', sup.performanceIssue.approach);
                addSupQA('performanceIssueResponse', sup.performanceIssue.response);
            }
            if (sup.feedback) {
                html += `<h3 class="pdf-subsection-title">Feedback Provided:</h3>`;
                addSupQA('feedbackPositive', sup.feedback.positive);
                addSupQA('feedbackImprovement', sup.feedback.improvement);
                addSupQA('feedbackActionPlan', sup.feedback.actionPlan);
                addSupQA('feedbackFollowUp', sup.feedback.followUp);
            }
            html += `</div>`;
        }
    
        html += `<p class="pdf-footer-note">End of Report - Generated on ${new Date().toLocaleDateString('en-AU')}</p>`;
        html += `</div>`; // Close pdf-wrapper
        return html;
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
    improveDropdownDisplay();
});

function improveDropdownDisplay() {
    // Get all select elements
    const selects = document.querySelectorAll('select');
    
    selects.forEach(select => {
        // Add event listener to show full text when focused
        select.addEventListener('mousedown', function(e) {
            if (window.innerWidth > 768) {
                // For desktop, we can use a wider dropdown
                this.style.width = 'auto';
                this.style.minWidth = '100%';
            }
        });
        
        // Reset width when dropdown is closed
        select.addEventListener('change', function() {
            this.style.width = '100%';
        });
        
        select.addEventListener('blur', function() {
            this.style.width = '100%';
        });
    });

}