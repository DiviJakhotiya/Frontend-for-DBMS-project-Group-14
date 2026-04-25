DROP DATABASE IF EXISTS hospital;
CREATE DATABASE hospital;
USE hospital;

-- ======================
-- CORE
-- ======================

CREATE TABLE Department (
    dept_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) UNIQUE NOT NULL
);

CREATE TABLE Doctor (
    doctor_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    phone_no VARCHAR(15) UNIQUE,
    dept_id INT NOT NULL,
    FOREIGN KEY (dept_id) REFERENCES Department(dept_id)
);

CREATE TABLE Patient (
    patient_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    age INT CHECK (age > 0),
    gender ENUM('Male','Female','Other') NOT NULL
);

-- ======================
-- CONSULTATION (DOCTOR OWNED)
-- ======================

CREATE TABLE Consultation (
    consult_id INT PRIMARY KEY AUTO_INCREMENT,
    patient_id INT NOT NULL,
    doctor_id INT NOT NULL,
    consult_date DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (patient_id) REFERENCES Patient(patient_id),
    FOREIGN KEY (doctor_id) REFERENCES Doctor(doctor_id)
);

-- ======================
-- DOCTOR AVAILABILITY (STRICT SLOT SYSTEM)
-- ======================

CREATE TABLE DoctorAvailability (
    availability_id INT PRIMARY KEY AUTO_INCREMENT,
    doctor_id INT NOT NULL,
    available_datetime DATETIME NOT NULL,
    is_booked BOOLEAN DEFAULT FALSE,

    FOREIGN KEY (doctor_id) REFERENCES Doctor(doctor_id),

    UNIQUE (doctor_id, available_datetime)
);

-- ======================
-- APPOINTMENT (STRICT + OWNERSHIP)
-- ======================

CREATE TABLE Appointment (
    appointment_id INT PRIMARY KEY AUTO_INCREMENT,
    consult_id INT NOT NULL,
    patient_id INT NOT NULL,
    doctor_id INT NOT NULL,
    appointment_datetime DATETIME NOT NULL,

    FOREIGN KEY (consult_id) REFERENCES Consultation(consult_id),
    FOREIGN KEY (patient_id) REFERENCES Patient(patient_id),
    FOREIGN KEY (doctor_id) REFERENCES Doctor(doctor_id),

    UNIQUE (doctor_id, appointment_datetime),
    UNIQUE (patient_id, appointment_datetime)
);

-- ======================
-- WARD + ROOM
-- ======================

CREATE TABLE Ward (
    ward_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE Room (
    room_no INT PRIMARY KEY,
    ward_id INT NOT NULL,
    FOREIGN KEY (ward_id) REFERENCES Ward(ward_id)
);

-- ======================
-- ADMISSION (STRICT 1-1)
-- ======================

CREATE TABLE Admission (
    admission_id INT PRIMARY KEY AUTO_INCREMENT,
    patient_id INT UNIQUE NOT NULL,
    room_no INT UNIQUE NOT NULL,
    admit_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    discharge_date DATETIME,

    FOREIGN KEY (patient_id) REFERENCES Patient(patient_id),
    FOREIGN KEY (room_no) REFERENCES Room(room_no)
);

-- ======================
-- MEDICINE + PRESCRIPTION
-- ======================

CREATE TABLE Medicine (
    medicine_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) UNIQUE NOT NULL
);

CREATE TABLE Prescription (
    prescription_id INT PRIMARY KEY AUTO_INCREMENT,
    consult_id INT NOT NULL,
    doctor_id INT NOT NULL,
    medicine_id INT NOT NULL,
    dosage VARCHAR(100),

    FOREIGN KEY (consult_id) REFERENCES Consultation(consult_id),
    FOREIGN KEY (doctor_id) REFERENCES Doctor(doctor_id),
    FOREIGN KEY (medicine_id) REFERENCES Medicine(medicine_id)
);

-- ======================
-- BILL (STRICT VALIDITY)
-- ======================

CREATE TABLE Bill (
    bill_id INT PRIMARY KEY AUTO_INCREMENT,
    patient_id INT NOT NULL,
    doctor_id INT NOT NULL,
    consult_id INT,
    admission_id INT,
    total_amount DECIMAL(10,2) CHECK (total_amount >= 0),
    status ENUM('Pending', 'Paid') DEFAULT 'Pending',

    FOREIGN KEY (patient_id) REFERENCES Patient(patient_id),
    FOREIGN KEY (doctor_id) REFERENCES Doctor(doctor_id),
    FOREIGN KEY (consult_id) REFERENCES Consultation(consult_id),
    FOREIGN KEY (admission_id) REFERENCES Admission(admission_id)
);

-- ======================
-- PAYMENT
-- ======================

CREATE TABLE Payment (
    payment_id INT PRIMARY KEY AUTO_INCREMENT,
    bill_id INT NOT NULL,
    amount DECIMAL(10,2) CHECK (amount > 0),
    method VARCHAR(50),
    payment_date DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (bill_id) REFERENCES Bill(bill_id)
);

-- ======================
-- USER AYTHENTICATION
-- ======================
CREATE TABLE User (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'doctor', 'staff', 'patient') NOT NULL,
    linked_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
