import React from "react"
import {screen, render} from "@testing-library/react"

import {PhotoGallery} from "./photo-gallery";

describe("PhotoGallery", () => {
    it("should render the component", () => {
        render(<PhotoGallery contentLanguage="en_US" message="World"/>);

        expect(screen.getByText(/Hello World/)).toBeInTheDocument();
    })
})
