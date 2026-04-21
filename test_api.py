import requests
import json
from datetime import datetime, timedelta

BASE_URL = "http://localhost:8001/api"
API_DOCS_URL = "http://localhost:8001/docs"

class TestRunner:
    def __init__(self):
        self.token = None
        self.user_id = None
        self.results = []
        self.session = requests.Session()
        
    def log(self, test_name, status, message="", details=""):
        result = {
            "test": test_name,
            "status": status,
            "message": message,
            "details": details
        }
        self.results.append(result)
        symbol = "[+]" if status == "PASS" else "[-]"
        print(f"{symbol} {test_name}: {status}")
        if message:
            print(f"  └─ {message}")
        if details:
            print(f"  └─ {details}")
    
    def test_health_check(self):
        """Test 1: Health check"""
        try:
            response = requests.get("http://localhost:8001/health")
            if response.status_code == 200:
                self.log("1. Health Check", "PASS", "Backend está funcionando")
            else:
                self.log("1. Health Check", "FAIL", f"Status: {response.status_code}")
        except Exception as e:
            self.log("1. Health Check", "FAIL", str(e))
    
    def test_register(self):
        """Test 2: Register new user"""
        try:
            user_data = {
                "email": f"test_{datetime.now().timestamp()}@example.com",
                "password": "TestPass123",
                "full_name": "Test User",
                "phone": "1234567890",
                "role": "patient"
            }
            response = self.session.post(f"{BASE_URL}/auth/register", json=user_data)
            if response.status_code == 200:
                data = response.json()
                self.user_id = data.get("id")
                self.test_email = user_data["email"]
                self.test_password = user_data["password"]
                self.log("2. Register User", "PASS", f"Usuario creado: {user_data['email']}")
            else:
                self.log("2. Register User", "FAIL", f"Status: {response.status_code}", response.text[:200])
        except Exception as e:
            self.log("2. Register User", "FAIL", str(e))
    
    def test_login(self):
        """Test 3: Login"""
        try:
            login_data = {
                "username": self.test_email,
                "password": self.test_password
            }
            response = self.session.post(f"{BASE_URL}/auth/login", data=login_data)
            if response.status_code == 200:
                data = response.json()
                self.token = data.get("access_token")
                self.session.headers.update({"Authorization": f"Bearer {self.token}"})
                self.log("3. Login", "PASS", "Token obtenido correctamente")
            else:
                self.log("3. Login", "FAIL", f"Status: {response.status_code}", response.text[:200])
        except Exception as e:
            self.log("3. Login", "FAIL", str(e))
    
    def test_get_current_user(self):
        """Test 4: Get current user"""
        try:
            response = self.session.get(f"{BASE_URL}/users/me")
            if response.status_code == 200:
                data = response.json()
                self.log("4. Get Current User", "PASS", f"Usuario: {data.get('email')}")
            else:
                self.log("4. Get Current User", "FAIL", f"Status: {response.status_code}", response.text[:200])
        except Exception as e:
            self.log("4. Get Current User", "FAIL", str(e))
    
    def test_get_kinesiologos(self):
        """Test 5: Get kinesiologos list"""
        try:
            response = self.session.get(f"{BASE_URL}/users/kinesiologos")
            if response.status_code == 200:
                data = response.json()
                self.log("5. Get Kinesiologos", "PASS", f"Total: {len(data)} kinesiologos")
            else:
                self.log("5. Get Kinesiologos", "FAIL", f"Status: {response.status_code}")
        except Exception as e:
            self.log("5. Get Kinesiologos", "FAIL", str(e))
    
    def test_get_appointments(self):
        """Test 6: Get appointments"""
        try:
            response = self.session.get(f"{BASE_URL}/appointments/")
            if response.status_code == 200:
                data = response.json()
                self.log("6. Get Appointments", "PASS", f"Total: {len(data)} turnos")
            else:
                self.log("6. Get Appointments", "FAIL", f"Status: {response.status_code}", response.text[:200])
        except Exception as e:
            self.log("6. Get Appointments", "FAIL", str(e))
    
    def test_create_appointment(self):
        """Test 7: Create appointment"""
        try:
            # Primero registrar un kinesiólogo para poder crear turno
            kinesiologo_data = {
                "email": f"kinesiologo_{datetime.now().timestamp()}@example.com",
                "password": "KinPass123",
                "full_name": "Test Kinesiologo",
                "phone": "0987654321",
                "role": "kinesiologo"
            }
            reg_response = self.session.post(f"{BASE_URL}/auth/register", json=kinesiologo_data)
            
            if reg_response.status_code == 200:
                # Get the kinesiologos list to obtain the kinesiologo_id (from kinesiologos table, not users table)
                kinesiologos_response = self.session.get(f"{BASE_URL}/users/kinesiologos-profiles")
                if kinesiologos_response.status_code == 200:
                    kinesiologos = kinesiologos_response.json()
                    if kinesiologos:
                        # Use the last registered kinesiologo
                        kinesiologo_id = kinesiologos[-1].get("kinesiologo_id")
                        
                        # Ahora crear el turno
                        appointment_date = (datetime.now() + timedelta(days=1)).isoformat()
                        appointment_data = {
                            "kinesiologo_id": kinesiologo_id,
                            "date": appointment_date,
                            "duration_minutes": 60,
                            "notes": "Primer turno de prueba"
                        }
                        response = self.session.post(f"{BASE_URL}/appointments/", json=appointment_data)
                        
                        if response.status_code == 200:
                            data = response.json()
                            self.appointment_id = data.get("id")
                            self.log("7. Create Appointment", "PASS", f"Turno creado: {data.get('id')}")
                        else:
                            self.log("7. Create Appointment", "FAIL", f"Status: {response.status_code}", response.text[:200])
                    else:
                        self.log("7. Create Appointment", "FAIL", "No kinesiologos found after registration")
                else:
                    self.log("7. Create Appointment", "FAIL", "Could not fetch kinesiologos list")
            else:
                self.log("7. Create Appointment", "FAIL", "No se pudo crear kinesiólogo")
        except Exception as e:
            self.log("7. Create Appointment", "FAIL", str(e))
    
    def test_update_appointment(self):
        """Test 8: Update appointment"""
        try:
            if not hasattr(self, 'appointment_id'):
                self.log("8. Update Appointment", "SKIP", "No hay turno para actualizar")
                return
            
            update_data = {
                "status": "confirmed",
                "notes": "Turno confirmado"
            }
            response = self.session.put(f"{BASE_URL}/appointments/{self.appointment_id}", json=update_data)
            
            if response.status_code == 200:
                self.log("8. Update Appointment", "PASS", f"Turno actualizado")
            else:
                self.log("8. Update Appointment", "FAIL", f"Status: {response.status_code}", response.text[:200])
        except Exception as e:
            self.log("8. Update Appointment", "FAIL", str(e))
    
    def test_delete_appointment(self):
        """Test 9: Delete appointment"""
        try:
            if not hasattr(self, 'appointment_id'):
                self.log("9. Delete Appointment", "SKIP", "No hay turno para eliminar")
                return
            
            response = self.session.delete(f"{BASE_URL}/appointments/{self.appointment_id}")
            
            if response.status_code == 200:
                self.log("9. Delete Appointment", "PASS", f"Turno eliminado")
            else:
                self.log("9. Delete Appointment", "FAIL", f"Status: {response.status_code}", response.text[:200])
        except Exception as e:
            self.log("9. Delete Appointment", "FAIL", str(e))
    
    def run_all_tests(self):
        """Run all tests"""
        print("="*60)
        print("INICIANDO PRUEBAS DE API")
        print("="*60)
        
        self.test_health_check()
        self.test_register()
        self.test_login()
        self.test_get_current_user()
        self.test_get_kinesiologos()
        self.test_get_appointments()
        self.test_create_appointment()
        self.test_update_appointment()
        self.test_delete_appointment()
        
        # Summary
        print("\n" + "="*60)
        print("RESUMEN DE PRUEBAS")
        print("="*60)
        passed = sum(1 for r in self.results if r["status"] == "PASS")
        failed = sum(1 for r in self.results if r["status"] == "FAIL")
        skipped = sum(1 for r in self.results if r["status"] == "SKIP")
        
        print(f"[+] Pasadas: {passed}")
        print(f"[-] Fallidas: {failed}")
        print(f"[/] Saltadas: {skipped}")
        print(f"Total: {len(self.results)}")
        
        # Print failed tests
        if failed > 0:
            print("\n" + "-"*60)
            print("TESTS QUE FALLARON:")
            print("-"*60)
            for r in self.results:
                if r["status"] == "FAIL":
                    print(f"\n{r['test']}")
                    print(f"  Mensaje: {r['message']}")
                    if r['details']:
                        print(f"  Detalles: {r['details'][:300]}")
        
        return passed, failed, skipped

if __name__ == "__main__":
    runner = TestRunner()
    passed, failed, skipped = runner.run_all_tests()
    import json
    with open('C:/tmp/test_results.json', 'w', encoding='utf-8') as f:
        json.dump(runner.results, f, indent=4)
