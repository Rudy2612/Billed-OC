/**
 * @jest-environment jsdom
 */

import { screen, fireEvent, waitFor } from "@testing-library/dom"
import NewBillUI from "../views/NewBillUI.js"
import NewBill from "../containers/NewBill.js"
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store";
import { ROUTES, ROUTES_PATH } from "../constants/routes.js";

jest.mock("../app/store", () => mockStore);

describe("Given I am connected as an employee", () => {

    beforeAll(() => {
        Object.defineProperty(window, 'localStorage', { value: localStorageMock })
        localStorage.setItem("user", JSON.stringify({ type: "Employee", email: "a@a" }));
        jest.spyOn(mockStore, "bills")
    });


    const onNavigate = pathname => {
        document.body.innerHTML = ROUTES({ pathname });
    };

    describe("When I am on NewBill Page, I can add image to my bill", () => {

        /*
          Ce test valide l'ajout d'une image dans le formulaire si elle correspond aux formats acceptés
        */
        test("Then the image is added if it is in the right format", async () => {

            // Génération de la page New Bill
            document.body.innerHTML = NewBillUI();

            // Instanciation des fonctionnalités du container NewBills.
            const newBill = new NewBill({
                document,
                onNavigate,
                store: mockStore,
                localStorage: window.localStorage,
            });
            // Espionnage des fonctions provenant du container NewBill
            const handleChangeFile = jest.spyOn(newBill, "handleChangeFile");
            const file_validation = jest.spyOn(newBill, "file_validation");


            // Chargement de l'image dans l'input prévu a cet effet.
            const imageInput = screen.getByTestId("file");
            imageInput.addEventListener("change", handleChangeFile);
            fireEvent.change(imageInput, {
                target: {
                    files: [
                        new File(["document"], "document.png", {
                            type: "image/png",
                        }),
                    ],
                },
            });

            // Verification si handleChangeFile a été appelé et si la validation de l'image a été accepté
            expect(handleChangeFile).toHaveBeenCalledTimes(1);
            expect(file_validation.mock.results[0].value).toBe(true);
        })


        /*
          Ce test valide le rejet d'une image dans le formulaire si elle ne  correspond pas aux formats acceptés
        */
        test("Then the image is not added because it is not in the right format", async () => {
            // Génération de la page New Bill
            document.body.innerHTML = NewBillUI();

            // Instanciation des fonctionnalités du container NewBills.
            const newBill = new NewBill({
                document,
                onNavigate,
                store: mockStore,
                localStorage: window.localStorage,
            });
            // Espionnage des fonctions provenant du container NewBill
            const handleChangeFile = jest.spyOn(newBill, "handleChangeFile");
            const file_validation = jest.spyOn(newBill, "file_validation");


            // Chargement de l'image dans l'input prévu a cet effet.
            const imageInput = screen.getByTestId("file");
            imageInput.addEventListener("change", handleChangeFile);
            fireEvent.change(imageInput, {
                target: {
                    files: [
                        new File(["document"], "document.pdf", {
                            type: "document/pdf",
                        }),
                    ],
                },
            });

            // Verification si handleChangeFile a été appelé et si la validation de l'image a été accepté
            expect(handleChangeFile).toHaveBeenCalledTimes(1);
            expect(file_validation.mock.results[0].value).toBe(false);
        })

    })



    describe("When I am on NewBill Page, I can submit my bill", () => {

        test("Then, the form is submit", async () => {
            // Génération de la page New Bill
            document.body.innerHTML = NewBillUI();

            // Instanciation des fonctionnalités du container NewBills.
            const newBill = new NewBill({
                document,
                onNavigate,
                store: mockStore,
                localStorage: window.localStorage,
            });

            // Espionnage des fonctions provenant du container NewBill
            const handleSubmit = jest.spyOn(newBill, "handleSubmit");
            const updateBill = jest.spyOn(newBill, "updateBill");

            // Données d'un bill de test
            const billTest = {
                type: 'Bill test',
                name: 'Test',
                date: '2022-02-19',
                amount: 200,
                vat: 20,
                pct: 10,
                commentary: 'Bill test',
                fileUrl: 'https://test.test',
                fileName: 'bill_test.jpg',
                status: 'pending',
            }

            // Ajout des données du bill test aux inputs du formulaire sous forme de value
            screen.getByTestId('expense-type').value = billTest.type
            screen.getByTestId('expense-name').value = billTest.name
            screen.getByTestId('datepicker').value = billTest.date
            screen.getByTestId('amount').value = billTest.amount
            screen.getByTestId('vat').value = billTest.vat
            screen.getByTestId('pct').value = billTest.pct
            screen.getByTestId('commentary').value = billTest.commentary

            // Click sur le bouton d'envoi du formulaire
            const newBillform = screen.getByTestId("form-new-bill")
            newBillform.addEventListener('submit', handleSubmit)
            fireEvent.submit(newBillform)

            // Verification si le formulaire a bien été envoyé et si le bill a bien été ajouté.
            expect(handleSubmit).toHaveBeenCalled()
            expect(updateBill).toHaveBeenCalled()
        })
    })

})